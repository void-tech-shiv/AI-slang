REGIONAL_HINTS: dict[str, list[tuple[str, str]]] = {
    "Vijayawada": [
        ("Bhai kya scene hai?", "Em scene ra?"),
        ("Kal bunk kare?", "Repu bunk cheddama?"),
        ("Chill maar", "Lite teesko ra"),
    ],
    "Hyderabad": [
        ("Kya kar raha hai bhai?", "Em chestunnav ra?"),
        ("Chill kar", "Lite teesko"),
        ("Kidhar hai?", "Ekkada unnav ra?"),
    ],
    "Delhi": [
        ("What is happening?", "Bhai kya scene hai?"),
        ("Relax", "Chill maar yaar"),
        ("Where are you?", "Kidhar hai bhai?"),
    ],
    "Mumbai": [
        ("What is happening?", "Kya scene hai bro?"),
        ("Relax", "Chill kar na"),
        ("Let's go", "Chal nikalte hain"),
    ],
}


def regional_examples(region: str) -> str:
    examples = REGIONAL_HINTS.get(region, [])
    if not examples:
        return "No fixed examples. Prefer broadly natural local speech."
    return "\n".join(f'- "{source}" → "{target}"' for source, target in examples)
