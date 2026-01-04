const fs = require('fs');
const path = require('path');

const charactersDir = path.join(__dirname, 'characters');
const jsonFiles = [
  'blue.json',
  'green.json',
  'grey.json',
  'red.json',
  'red-blue.json',
  'special.json',
  'yellow.json'
];

// Function to check if a note is redundant
function isRedundantNote(note, worksWellWith, doesntWorkWellWith) {
  const lowerNote = note.toLowerCase();
  
  // Check for "Works well" patterns
  if (lowerNote.includes('works well')) {
    // Check if any worksWellWith item appears in the note
    for (const item of worksWellWith) {
      const lowerItem = item.toLowerCase();
      // Check if the note contains the item or a variation
      if (lowerNote.includes(lowerItem) || 
          lowerNote.includes(lowerItem.replace(/\(.*?\)/g, '').trim()) ||
          // Handle variations like "few amount of players" vs "games with few amount of players"
          (lowerItem.includes('few') && lowerNote.includes('few')) ||
          (lowerItem.includes('players') && lowerNote.includes('players'))) {
        return true;
      }
    }
  }
  
  // Check for "Works poorly" or "Doesn't work well" patterns
  if (lowerNote.includes('works poorly') || lowerNote.includes("doesn't work well")) {
    // Check if any doesntWorkWellWith item appears in the note
    for (const item of doesntWorkWellWith) {
      const lowerItem = item.toLowerCase();
      // Check if the note contains the item or mentions key terms
      if (lowerNote.includes(lowerItem) ||
          // Handle partial matches for complex items
          (lowerItem.includes('greys') && lowerNote.includes('greys')) ||
          (lowerItem.includes('players') && lowerNote.includes('players')) ||
          (lowerItem.includes('ninjas') && lowerNote.includes('ninjas')) ||
          (lowerItem.includes('conspirators') && lowerNote.includes('conspirators')) ||
          (lowerItem.includes('fewer') && lowerNote.includes('fewer')) ||
          (lowerItem.includes('less') && lowerNote.includes('less'))) {
        return true;
      }
    }
  }
  
  return false;
}

// Process each JSON file
jsonFiles.forEach(fileName => {
  const filePath = path.join(charactersDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${fileName} - file not found`);
    return;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  
  let totalRemoved = 0;
  
  if (data.characters && Array.isArray(data.characters)) {
    data.characters.forEach((character, index) => {
      if (!character.notes || !Array.isArray(character.notes)) {
        return;
      }
      
      const worksWellWith = character.worksWellWith || [];
      const doesntWorkWellWith = character.doesntWorkWellWith || [];
      
      const originalLength = character.notes.length;
      character.notes = character.notes.filter(note => {
        return !isRedundantNote(note, worksWellWith, doesntWorkWellWith);
      });
      
      const removed = originalLength - character.notes.length;
      if (removed > 0) {
        totalRemoved += removed;
        console.log(`  ${character.name}: Removed ${removed} redundant note(s)`);
      }
    });
    
    // Write the updated JSON back to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`${fileName}: Processed, removed ${totalRemoved} redundant note(s) total\n`);
  }
});

console.log('Done processing all character files!');
