export const applyAutoCorrect = (text: string): { correctedText: string; wasCorrected: boolean } => {
  if (!text || typeof text !== 'string') return { correctedText: text, wasCorrected: false };

  const corrections: Record<string, string> = {
    'q': 'que',
    'xq': 'porque',
    'porq': 'porque',
    'tambien': 'también',
    'mas': 'más',
    'codigo': 'código',
    'estacion': 'estación',
    'avion': 'avión',
    'telefono': 'teléfono',
    'ningun': 'ningún',
    'adios': 'adiós',
    'corazon': 'corazón',
    'cancion': 'canción',
    'facil': 'fácil',
    'dificil': 'difícil',
    'rapido': 'rápido',
    'ultimo': 'último',
    'musica': 'música',
    'sabado': 'sábado',
    'miercoles': 'miércoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'examen': 'exámen',
    'puedes': 'puedes',
    'ademas': 'además',
    'aqui': 'aquí',
    'alli': 'allí',
    'ahi': 'ahí',
    'dia': 'día',
    'dias': 'días',
  };

  let wasCorrected = false;
  let words = text.split(/\s+/);
  
  words = words.map((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
    if (corrections[cleanWord]) {
      wasCorrected = true;
      const replaced = corrections[cleanWord];
      return word.toLowerCase().includes(cleanWord) ? word.replace(new RegExp(cleanWord, 'gi'), replaced) : replaced;
    }
    return word;
  });

  let correctedText = words.join(' ');

  if (correctedText.length > 0) {
    const firstChar = correctedText.charAt(0);
    if (firstChar !== firstChar.toUpperCase() && /[a-záéíóúüñ]/.test(firstChar)) {
      correctedText = firstChar.toUpperCase() + correctedText.slice(1);
      wasCorrected = true;
    }
  }

  return { correctedText, wasCorrected };
};
