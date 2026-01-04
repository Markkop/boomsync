# Character Data Structure

This directory contains character data extracted from the game rules, organized into multiple JSON files for easy filtering, searching, and linking.

## File Structure

### Main Index
- **index.json** - Master index of all characters with basic information (name, team, file location, tags, requirements) for quick searching

### Team-Based Files
- **red.json** - Red Team characters
- **blue.json** - Blue Team characters  
- **red-blue.json** - Characters that can be either Red Team or Blue Team
- **grey.json** - Grey Team (neutral) characters
- **green.json** - Green Team characters
- **yellow.json** - Yellow Team characters
- **special.json** - Characters with unique team affiliations (black, pink, purple)

## Character Schema

Each character object contains:

```json
{
  "name": "Character Name",
  "winCondition": "Description of win condition",
  "powers": [
    {
      "name": "POWER NAME",
      "type": "power type (card share, condition, etc.)",
      "description": "Full description of the power",
      "limitations": "Optional limitations or special rules"
    }
  ],
  "tags": ["array", "of", "tags"],
  "worksWellWith": ["array", "of", "character names or conditions"],
  "doesntWorkWellWith": ["array", "of", "character names or conditions"],
  "requires": ["array", "of", "required characters"],
  "notes": ["array", "of", "additional notes"]
}
```

## Common Tags

- **card share power** - Character has a power that activates on card sharing
- **color share power** - Character has a power that activates on color sharing
- **private reveal power** - Character can privately reveal their card
- **public reveal power** - Character can publicly reveal their card
- **condition** - Character starts with or can apply conditions
- **contagious** - Condition spreads to other players
- **acting** - Requires acting/roleplay
- **card swap** - Character can swap cards
- **bury** - Character is a backup/secondary character
- **primary character** - Core character for team win conditions
- **pause game XX** - Character pauses the game for XX seconds
- **odd player count** - Only works with odd number of players

## Usage Examples

### Find all characters with card share powers
Search for `"card share power"` in the tags array across all files.

### Find characters that work well together
Check the `worksWellWith` arrays for character names.

### Find character requirements
Check the `requires` array to see which characters must be played together.

### Link characters
Use the `worksWellWith`, `doesntWorkWellWith`, and `requires` arrays to build character relationships.

## Notes

- All data is extracted directly from the source material - no data was invented
- Characters may appear in multiple files if they have multiple team affiliations
- The index.json file provides quick lookup without loading full character details
- Team files contain complete character information for filtering by team
