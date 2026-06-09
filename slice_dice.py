import sys
import os

# Ensure Pillow is installed for image manipulation
try:
    from PIL import Image
except ImportError:
    import subprocess
    print("Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

image_path = r"C:\Users\Rushi\Desktop\Ludo_v2\assets\CuteDice - AssetPack_v1.0\UpscaledDice_Pink.png"
output_dir = r"C:\Users\Rushi\Desktop\Ludo_v2\assets\CuteDice - AssetPack_v1.0"

img = Image.open(image_path)
width, height = img.size

# The image is a 6x6 grid
cell_width = width // 6
cell_height = height // 6

print(f"Original image size: {width}x{height}. Slicing 6 faces of size {cell_width}x{cell_height}...")

for i in range(6):
    left = i * cell_width
    upper = 0
    right = left + cell_width
    lower = cell_height
    
    face = img.crop((left, upper, right, lower))
    output_path = os.path.join(output_dir, f"Pink_Dice_Face_{i+1}.png")
    face.save(output_path)
    print(f"Saved {output_path}")

print("\nSuccessfully extracted the top 6 faces!")
