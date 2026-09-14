import os
import math
import numpy as np
from PIL import Image

SRC_IMG_PATH = 'data/fig13_full.png'
im_src = Image.open(SRC_IMG_PATH)
arr_src = np.array(im_src)
H_SRC, W_SRC, _ = arr_src.shape

OUTPUT_DIR = 'website/frontend/public/tiles'

LAYERS = {
    'mean_475': {
        'dx': 0,
        'dy': 0,
        'w': 578,
        'h': 1066,
        'has_cb': True,
        'has_legend': False,
    },
    'median_475': {
        'dx': 578,
        'dy': 0,
        'w': 578,
        'h': 1066,
        'has_cb': False,
        'has_legend': True,
    },
    'mean_minus_median_475': {
        'dx': 0,
        'dy': 1066,
        'w': 578,
        'h': H_SRC - 1066,
        'has_cb': True,
        'has_legend': False,
    },
    'median_2475': {
        'dx': 578,
        'dy': 1066,
        'w': 578,
        'h': H_SRC - 1066,
        'has_cb': True,
        'has_legend': False,
    },
}

PX_GRID, PY_GRID = np.meshgrid(np.arange(256), np.arange(256))

def render_tile(layer_id, z, tx, ty):
    cfg = LAYERS[layer_id]
    dx = cfg['dx']
    dy = cfg['dy']
    pw = cfg['w']
    ph = cfg['h']
    
    # Calculate lon, lat for every pixel in the tile
    n = 2.0 ** z
    global_px = tx * 256.0 + PX_GRID
    global_py = ty * 256.0 + PY_GRID
    
    lon_grid = global_px / (n * 256.0) * 360.0 - 180.0
    lat_rad_grid = np.arctan(np.sinh(np.pi * (1.0 - 2.0 * global_py / (n * 256.0))))
    lat_grid = np.degrees(lat_rad_grid)
    
    # Geographic bounding box filter: Taiwan main island and immediate offshore islands
    in_geo_box = (
        (lat_grid >= 21.80) & (lat_grid <= 25.35) &
        (lon_grid >= 119.90) & (lon_grid <= 122.10)
    )
    
    if not np.any(in_geo_box):
        return None

    # Convert lon, lat to Panel A coordinates:
    # x_A = 270.0 * lon + 2.70 * lat - 32432.63
    # y_A = -291.3 * lat + 7394.57
    xa = 270.0 * lon_grid + 2.70 * lat_grid - 32432.63
    ya = -291.3 * lat_grid + 7394.57
    
    # Strict panel bounding box check (prevents any cross-panel bleeding):
    in_panel = (xa >= 0) & (xa < pw) & (ya >= 0) & (ya < ph)
    
    # Northwest ocean title & RP annotation mask:
    is_nw_text = (
        ((ya < 50) & (xa < 415)) |
        ((ya >= 50) & (ya < 86) & (xa < 385)) |
        ((ya >= 86) & (ya < 210) & (xa < 255))
    )
    
    # Colorbar in Panel A, C, D (Pacific Ocean east of Taiwan):
    # xa >= 475 masks colorbar, numbers, and 0.0 bottom tip,
    # while preserving Orchid Island (xa <= 470) and Green Island (xa ~ 440)
    is_cb = cfg['has_cb'] & (xa >= 475) & (ya >= 580)
    
    # Legend in Panel B (ocean southeast of Hengchun):
    is_legend = cfg['has_legend'] & (
        ((ya >= 958) & (xa >= 175) & (xa < 430)) |
        ((ya >= 985) & (xa >= 430))
    )
    
    # Global image coordinates in data/fig13_full.png:
    gx = xa + dx
    gy = ya + dy
    
    # Clip to valid image bounds
    gx_int = np.clip(np.round(gx).astype(int), 0, W_SRC - 1)
    gy_int = np.clip(np.round(gy).astype(int), 0, H_SRC - 1)
    
    # Sample RGB
    rgb = arr_src[gy_int, gx_int]
    
    # Sea / white background detection:
    is_sea = (rgb[:, :, 0] > 245) & (rgb[:, :, 1] > 245) & (rgb[:, :, 2] > 245)
    
    # Compute Alpha: 255 for land, 0 for sea / annotations / outside panel
    alpha = np.where(
        in_geo_box & in_panel & (~is_sea) & (~is_nw_text) & (~is_cb) & (~is_legend),
        255,
        0
    ).astype(np.uint8)
    
    if np.sum(alpha) == 0:
        return None
        
    rgba = np.dstack([rgb, alpha])
    return Image.fromarray(rgba, mode='RGBA')

def generate_all():
    bbox = (21.7, 119.8, 25.5, 122.2) # south, west, north, east
    
    for layer_id in LAYERS.keys():
        print(f'Generating tiles for layer: {layer_id}...')
        # Clear existing tiles for this layer to remove any stale/leaked tiles
        layer_dir = os.path.join(OUTPUT_DIR, layer_id)
        if os.path.exists(layer_dir):
            import shutil
            shutil.rmtree(layer_dir)
            
        count = 0
        for z in range(6, 11): # generate z=6 through 10
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
                        
        print(f'   Layer {layer_id}: generated {count} non-empty tiles.')

if __name__ == '__main__':
    generate_all()
