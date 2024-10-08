// CSV source URL
const csvURL = 'https://technochicken.github.io/ral_classic.csv';

let ralTable = {};  // Will store RAL code mappings

// Fetch and parse the CSV
function loadRALData() {
    Papa.parse(csvURL, {
        download: true,
        header: true,
        complete: function(results) {
            ralTable = processCSVData(results.data);
        }
    });
}

// Convert CSV data to an easy lookup object
function processCSVData(data) {
    const lookupTable = {};
    data.forEach(row => {
        const ralCode = row.RAL ? row.RAL.trim() : null;
        const hexValue = row.HEX ? row.HEX.trim() : null;
        const rgbValue = row.RGB ? row.RGB.split('-').map(Number) : null;

        // Only process rows that have valid RAL and HEX values
        if (ralCode && hexValue && rgbValue) {
            lookupTable[ralCode] = {
                hex: hexValue,
                name: row.English ? row.English.trim() : "Unknown",
                rgb: rgbValue
            };
        }
    });
    return lookupTable;
}

// Utility function to normalize hex input (#fff, fff, #ffffff, ffffff -> #ffffff)
function normalizeHex(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    return `#${hex}`;
}

// Utility function to convert hex to RGB array [R, G, B]
function hexToRgb(hex) {
    hex = normalizeHex(hex).substring(1); // Remove #
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Calculate Euclidean distance between two RGB arrays
function calculateDistance(rgb1, rgb2) {
    return Math.sqrt(
        Math.pow(rgb2[0] - rgb1[0], 2) +
        Math.pow(rgb2[1] - rgb1[1], 2) +
        Math.pow(rgb2[2] - rgb1[2], 2)
    );
}

// Class for converting RAL, HEX, and Names, and finding the closest color
class RALConverter {
    // Convert RAL code to HEX
    static ralToHex(ral) {
        if (ralTable[ral]) {
            return ralTable[ral].hex;
        } else {
            return { error: "RAL code not found." };
        }
    }

    // Convert HEX to RAL and name
    static hexToRal(hex) {
        hex = normalizeHex(hex);
        const rgb = hexToRgb(hex);
        let closestRAL = null;
        let minDistance = Infinity;
        let closestName = null;

        // Loop through each RAL entry and find the closest color
        for (const [ralCode, data] of Object.entries(ralTable)) {
            const distance = calculateDistance(rgb, data.rgb);
            if (distance < minDistance) {
                minDistance = distance;
                closestRAL = ralCode;
                closestName = data.name;
            }
        }

        return {
            ral: closestRAL,
            name: closestName,
            similarity: (100 - (minDistance / (Math.sqrt(3 * Math.pow(255, 2))) * 100)).toFixed(2) // Similarity percentage
        };
    }

    // Convert RAL code to RAL name
    static ralToName(ral) {
        if (ralTable[ral]) {
            return ralTable[ral].name;
        } else {
            return { error: "RAL code not found." };
        }
    }

    // Convert HEX to RGB
    static hexToRgb(hex) {
        return hexToRgb(normalizeHex(hex));
    }
}

// Attach the class to the global `window` object
window.RALConverter = RALConverter;

// Load the CSV data on page load
loadRALData();

// Find the closest RAL color and display in HTML
function findClosestRal() {
    const hexValue = document.getElementById("hexInput").value;
    const result = RALConverter.hexToRal(hexValue);
    document.getElementById("closestRalResult").innerText = 
        result.error ? result.error : 
        `Closest RAL: ${result.ral}, Name: ${result.name}, Similarity: ${result.similarity}%`;
}

// Convert RAL to HEX and display in HTML
function convertRalToHex() {
    const ralValue = document.getElementById("ralInput").value;
    const result = RALConverter.ralToHex(ralValue);
    document.getElementById("ralToHexResult").innerText = 
        result.error ? result.error : `HEX: ${result}`;
}
