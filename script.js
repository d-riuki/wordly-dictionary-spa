
const searchForm = document.querySelector("#search-form");
const wordInput = document.querySelector("#word-input");
const resultsSection = document.querySelector("#results");
const message = document.querySelector("#message");

const wordTitle = document.querySelector("#word-title");
const phonetic = document.querySelector("#phonetic");
const definitionsContainer = document.querySelector("#definitions");
const synonymsContainer = document.querySelector("#synonyms");
const sourcesContainer = document.querySelector("#sources");
const audioButton = document.querySelector("#audio-button");

// Listen for the user submitting the search form
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const word = wordInput.value.trim();

  if (word === "") {
    showMessage("Please enter a word to search.", true);
    return;
  }

  searchWord(word);
});

// Fetch word information from the dictionary API
async function searchWord(word) {
  showMessage("Searching for your word...");
  resultsSection.hidden = true;
  audioButton.hidden = true;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Word not found. Try another word.");
      }

      throw new Error("Unable to fetch the word. Please try again.");
    }

    const data = await response.json();

    displayWord(data[0]);
    showMessage("");
  } catch (error) {
    showMessage(error.message, true);
  }
}

// Display the information returned by the API
function displayWord(wordData) {
  wordTitle.textContent = wordData.word;
  phonetic.textContent = wordData.phonetic || "Phonetic spelling unavailable";

  definitionsContainer.innerHTML = "";
  synonymsContainer.innerHTML = "";
  sourcesContainer.innerHTML = "";

  // Display meanings and definitions
  wordData.meanings.forEach(function (meaning) {
    const heading = document.createElement("h3");
    heading.textContent = meaning.partOfSpeech;
    definitionsContainer.appendChild(heading);

    meaning.definitions.forEach(function (item) {
      const definition = document.createElement("p");
      definition.textContent = item.definition;
      definitionsContainer.appendChild(definition);

      if (item.example) {
        const example = document.createElement("p");
        example.textContent = `Example: "${item.example}"`;
        example.classList.add("example");
        definitionsContainer.appendChild(example);
      }
    });
  });

  // Collect synonyms from all meanings and definitions
  const synonyms = wordData.meanings.flatMap(function (meaning) {
    const meaningSynonyms = meaning.synonyms || [];

    const definitionSynonyms = meaning.definitions.flatMap(function (item) {
      return item.synonyms || [];
    });

    return [...meaningSynonyms, ...definitionSynonyms];
  });

  const uniqueSynonyms = [...new Set(synonyms)];

  if (uniqueSynonyms.length > 0) {
    uniqueSynonyms.forEach(function (synonym) {
      const span = document.createElement("span");
      span.textContent = synonym;
      span.classList.add("synonym");
      synonymsContainer.appendChild(span);
    });
  } else {
    synonymsContainer.textContent = "No synonyms available.";
  }

  // Display source links
  if (wordData.sourceUrls && wordData.sourceUrls.length > 0) {
    const heading = document.createElement("h3");
    heading.textContent = "Sources";
    sourcesContainer.appendChild(heading);

    wordData.sourceUrls.forEach(function (url) {
      const link = document.createElement("a");
      link.href = url;
      link.textContent = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      sourcesContainer.appendChild(link);
      sourcesContainer.appendChild(document.createElement("br"));
    });
  }

  // Find an available pronunciation audio file
  const audioEntry = (wordData.phonetics || []).find(function (item) {
    return item.audio;
  });

  if (audioEntry) {
    audioButton.hidden = false;

    audioButton.onclick = async function () {
      const audio = new Audio(audioEntry.audio);

      try {
        await audio.play();
      } catch (error) {
        showMessage("Unable to play pronunciation audio.", true);
      }
    };
  } else {
    audioButton.hidden = true;
    audioButton.onclick = null;
  }

  resultsSection.hidden = false;
}

// Display status and error messages
function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
