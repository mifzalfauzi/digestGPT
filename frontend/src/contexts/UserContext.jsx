

function getInitials(name) {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    console.log(words)
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  export { getInitials }