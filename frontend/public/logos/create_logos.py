from PIL import Image, ImageDraw, ImageFont

def create_logo(filename, bg_color, text_color, letter, name):
    # Create image
    img = Image.new('RGB', (200, 200), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a nice font
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 80)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        # Fallback to default font
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw letter
    bbox = draw.textbbox((0, 0), letter, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (200 - text_width) // 2
    y = 60
    draw.text((x, y), letter, fill=text_color, font=font_large)
    
    # Draw name
    bbox_small = draw.textbbox((0, 0), name, font=font_small)
    text_width_small = bbox_small[2] - bbox_small[0]
    x_small = (200 - text_width_small) // 2
    y_small = 140
    draw.text((x_small, y_small), name, fill=text_color, font=font_small)
    
    # Save
    img.save(filename)
    print(f"Created {filename}")

# Create logos
create_logo('uber.png', '#000000', '#FFFFFF', 'U', 'UBER')
create_logo('rapido.png', '#FFC107', '#000000', 'R', 'RAPIDO')
create_logo('namma_yatri.png', '#7C3AED', '#FFFFFF', 'NY', 'NAMMA YATRI')

print("All logos created successfully!")
