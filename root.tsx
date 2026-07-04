// Au tout début du fichier
console.time("ROOT_IMPORT");
console.log("🟢 Importing __root");

// ... le reste du code ...

// Juste avant `export const Route =`
console.timeLog("ROOT_IMPORT", "before Route");

// Tout à la fin du fichier
console.timeEnd("ROOT_IMPORT");
