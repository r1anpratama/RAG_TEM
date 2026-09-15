import os
import math
import numpy as np
from PIL import Image
from scipy.ndimage import (
    map_coordinates, gaussian_filter, binary_fill_holes, 
    binary_dilation, binary_erosion, distance_transform_edt, label
)

SRC_IMG_PATH = 'data/raw/fig13_full.png'
im_src = Image.open(SRC_IMG_PATH)
arr_src = np.array(im_src, dtype=np.float32)
H_SRC, W_SRC, _ = arr_src.shape

OUTPUT_DIR = 'website/frontend/public/tiles'

# Extract panels
panel_a_rgb = arr_src[0:1066, 0:578].copy()
panel_b_rgb = arr_src[0:1066, 578:1156].copy()
panel_c_rgb = arr_src[1066:2129, 0:578].copy()
panel_d_rgb = arr_src[1066:2129, 578:1156].copy()

# Seamlessly repair Panel B southern tip from Panel A (where the paper printed the legend box):
# Mean 475 and Median 475 in Hengchun Peninsula are identical (Mean-Median is 0.00 g).
panel_b_rgb[945:1045, 160:275] = panel_a_rgb[945:1045, 160:275]

def build_master_rgba(rgb, has_cb, has_legend, is_diverging=False):
    h, w, _ = rgb.shape
    ya_grid, xa_grid = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
    
    # 1. Base luminance
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    
    # 2. Exclude paper annotations from land:
    # Northwest title & RP text:
    is_nw_title = (
        ((ya_grid < 50) & (xa_grid < 390)) |
        ((ya_grid >= 50) & (ya_grid < 76) & (xa_grid < 380)) |
        ((ya_grid >= 76) & (ya_grid < 82) & (xa_grid < (360 + (81 - ya_grid) * 4))) |
        ((ya_grid >= 82) & (ya_grid < 140) & (xa_grid < 265)) |
        ((ya_grid >= 140) & (ya_grid < 210) & (xa_grid < 255))
    )
    # Colorbar in the Pacific Ocean:
    is_cb = has_cb & (xa_grid >= 475) & (ya_grid >= 580)
    # Legend in Panel B (ocean southeast of Hengchun):
    is_leg = has_legend & (
        ((ya_grid >= 980) & (xa_grid >= 270)) |
        ((ya_grid >= 1020) & (xa_grid >= 160))
    )
    # Outer image margins:
    is_margin = (xa_grid < 15) | (xa_grid >= w - 10) | (ya_grid < 15) | (ya_grid >= h - 10)
    
    is_nonwhite = (lum < 246.0) & (~(is_nw_title | is_cb | is_leg | is_margin))
    
    # Bridge coastal fault cuts using morphological closing:
    closed = binary_erosion(binary_dilation(is_nonwhite, iterations=3), iterations=3)
    is_land_solid = binary_fill_holes(closed)
    
    # Clean offshore whisker lines, preserving mainland, Green Island, and Orchid Island:
    lbl, num = label(is_land_solid)
    sizes = np.bincount(lbl.ravel())
    mainland_raw = (lbl == np.argmax(sizes[1:]) + 1)
    mainland_opened = binary_dilation(binary_erosion(mainland_raw, iterations=2), iterations=2)
    dist_to_opened = distance_transform_edt(~mainland_opened)
    clean_mainland = mainland_raw & (dist_to_opened <= 3.5)
    clean_mainland = binary_fill_holes(clean_mainland)
    
    islands = np.zeros_like(is_land_solid)
    for i in range(1, num + 1):
        if 15 < sizes[i] < 2000:
            islands |= (lbl == i)
    is_land_final = binary_fill_holes(clean_mainland | islands)
    
    # Inpainting: remove black fault lines and white borders, seamlessly matching surrounding hazard colors
    if is_diverging:
        is_defect = is_land_final & (lum < 75.0)
    else:
        is_defect = is_land_final & ((lum < 75.0) | (lum > 240.0))
        
    is_defect_dil = binary_dilation(is_defect, iterations=1) & is_land_final
    is_valid = is_land_final & (~is_defect_dil)
    
    indices = distance_transform_edt(~is_valid, return_distances=False, return_indices=True)
    rgb_clean = rgb.copy()
    for c in range(3):
        chan = rgb[:, :, c]
        rgb_clean[:, :, c] = chan[tuple(indices)]
        chan_sm = gaussian_filter(rgb_clean[:, :, c], sigma=0.8)
        rgb_clean[is_defect_dil, c] = chan_sm[is_defect_dil]
    
    # Smooth alpha feathering at boundary:
    alpha = np.where(is_land_final, 1.0, 0.0)
    alpha_smooth = gaussian_filter(alpha, sigma=0.8)
    alpha_final = np.clip((alpha_smooth - 0.1) / 0.8, 0.0, 1.0)
    
    # De-matte white background from coastal edge pixels:
    mask_blend = (alpha_final > 0) & (alpha_final < 1.0)
    a_val = alpha_final[mask_blend, None]
    rgb_clean[mask_blend] = np.clip(
        (rgb_clean[mask_blend] - (1.0 - a_val) * 255.0) / np.maximum(a_val, 0.1),
        0.0,
        255.0
    )
    
    return np.dstack([rgb_clean, alpha_final * 255.0]).astype(np.float32)

print('Building master anti-aliased, line-free RGBA layers...')
MASTER_LAYERS = {
    'mean_475': build_master_rgba(panel_a_rgb, True, False, False),
    'median_475': build_master_rgba(panel_b_rgb, False, True, False),
    'mean_minus_median_475': build_master_rgba(panel_c_rgb, True, False, True),
    'median_2475': build_master_rgba(panel_d_rgb, True, False, False),
}
print('Master layers built successfully.')

PX_GRID, PY_GRID = np.meshgrid(np.arange(256), np.arange(256))

def render_tile(layer_id, z, tx, ty):
    master = MASTER_LAYERS[layer_id]
    
    n = 2.0 ** z
    global_px = tx * 256.0 + PX_GRID
    global_py = ty * 256.0 + PY_GRID
    
    lon_grid = global_px / (n * 256.0) * 360.0 - 180.0
    lat_rad_grid = np.arctan(np.sinh(np.pi * (1.0 - 2.0 * global_py / (n * 256.0))))
    lat_grid = np.degrees(lat_rad_grid)
    
    # Geographic bounding box filter
    in_geo_box = (
        (lat_grid >= 21.80) & (lat_grid <= 25.35) &
        (lon_grid >= 119.90) & (lon_grid <= 122.10)
    )
    
    if not np.any(in_geo_box):
        return None

    # Affine coordinate projection:
    xa = 270.0 * lon_grid + 2.70 * lat_grid - 32432.63
    ya = -291.3 * lat_grid + 7394.57
    
    coords = np.array([ya, xa], dtype=np.float32)
    
    # Continuous sub-pixel Bilinear Interpolation (order=1):
    chans = [
        map_coordinates(master[:, :, c], coords, order=1, mode='constant', cval=0.0)
        for c in range(4)
    ]
    tile = np.stack(chans, axis=-1)
    
    # Strict geographic containment
    alpha = tile[:, :, 3]
    alpha = np.where(in_geo_box, alpha, 0.0)
    tile[:, :, 3] = np.clip(alpha, 0.0, 255.0)
    
    if np.sum(tile[:, :, 3] > 0) == 0:
        return None
        
    return Image.fromarray(tile.astype(np.uint8), mode='RGBA')

def generate_all():
    bbox = (21.7, 119.8, 25.5, 122.2) # south, west, north, east
    
    for layer_id in MASTER_LAYERS.keys():
        print(f'Generating smooth tiles for layer: {layer_id}...')
        layer_dir = os.path.join(OUTPUT_DIR, layer_id)
        if os.path.exists(layer_dir):
            import shutil
            shutil.rmtree(layer_dir)
            
        count = 0
        # Generate zooms 6 through 11 for silky smooth detail
        for z in range(6, 12):
            n = 2.0 ** z
            tx_min = int((bbox[1] + 180.0) / 360.0 * n)
            tx_max = int((bbox[3] + 180.0) / 360.0 * n)
            
            lat_rad_max = math.radians(bbox[2])
            lat_rad_min = math.radians(bbox[0])
            ty_min = int((1.0 - math.asinh(math.tan(lat_rad_max)) / math.pi) / 2.0 * n)
            ty_max = int((1.0 - math.asinh(math.tan(lat_rad_min)) / math.pi) / 2.0 * n)
            
            for tx in range(tx_min, tx_max + 1):
                for ty in range(ty_min, ty_max + 1):
                    tile_img = render_tile(layer_id, z, tx, ty)
                    if tile_img is not None:
                        out_dir = os.path.join(OUTPUT_DIR, layer_id, str(z), str(tx))
                        os.makedirs(out_dir, exist_ok=True)
                        out_path = os.path.join(out_dir, f'{ty}.png')
                        tile_img.save(out_path, 'PNG', optimize=True)
                        count += 1
                        
        print(f'   Layer {layer_id}: generated {count} smooth anti-aliased tiles.')

if __name__ == '__main__':
    generate_all()
