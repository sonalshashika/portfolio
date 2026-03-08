from rembg import remove
from PIL import Image

input_path = r"C:\Users\Sonal\.gemini\antigravity\brain\e44cffbb-ae0f-461f-95d9-488a01f7d585\media__1772863650612.jpg"
output_path = r"d:\programing\portfolio\images\profile.png"

input_image = Image.open(input_path)
# Remove background
output_image = remove(input_image)

# The user explicitly asked for "upper body" previously.
# Let's crop the bottom 15% to ensure it's focused on the upper body.
width, height = output_image.size
cropped_image = output_image.crop((0, 0, width, int(height * 0.85)))

cropped_image.save(output_path)
print(f"Background perfectly removed, cropped, and saved to {output_path}")
