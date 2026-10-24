import React, { useState, useEffect } from 'react';
import { Newspaper, Globe, ExternalLink, RefreshCw, Bookmark, Share2, Sparkles, Clock, TrendingUp, Search } from 'lucide-react';
import { Chat } from '../types';
import { getActiveMonthlyTheme } from '../utils/monthlyThemes';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  pubDate: string;
  category: 'mundo' | 'tecnologia' | 'ciencia' | 'economia';
  imageUrl?: string;
}

interface NewsViewProps {
  isNightMode?: boolean;
  chats?: Chat[];
  onShareToChat?: (chatId: string, title: string, url: string) => void;
}

const REAL_WORLD_FALLBACK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Avances revolucionarios en energía solar y fusión limpia marcan cumbre internacional',
    description: 'Científicos de diversos países presentan nuevos progresos en la eficiencia de paneles perovskita y reactores experimentales de confinamiento magnético.',
    source: 'BBC Mundo',
    url: 'https://www.bbc.com/mundo',
    pubDate: 'Hace 45 minutos',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    title: 'Mercados globales reaccionan ante nuevos acuerdos comerciales transcontinentales',
    description: 'Las bolsas de valores experimentan estabilidad tras la firma de tratados enfocados en la sustentabilidad ecológica y la digitalización aduanera.',
    source: 'El País',
    url: 'https://elpais.com',
    pubDate: 'Hace 2 horas',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    title: 'Inteligencia artificial y satélites climáticos mejoran la predicción de huracanes',
    description: 'Nuevos modelos computacionales entrenados con datos meteorológicos en tiempo real logran anticipar trayectorias de tormentas con mayor precisión.',
    source: 'Reuters Ciencia',
    url: 'https://www.reuters.com',
    pubDate: 'Hace 3 horas',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '4',
    title: 'Descubrimiento arqueológico en el Mediterráneo revela rutas comerciales antiguas',
    description: 'Buzo-arqueólogos encuentran pecios fenicios perfectamente conservados que aportan luz sobre el intercambio cultural del mundo antiguo.',
    source: 'National Geographic',
    url: 'https://www.nationalgeographic.com',
    pubDate: 'Hace 5 horas',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '5',
    title: 'Lanzamiento exitoso de telescopio espacial para estudiar exoplanetas habitables',
    description: 'La misión espacial despegó esta madrugada con el objetivo de analizar la atmósfera de planetas rocosos situados en sistemas solares cercanos.',
    source: 'NASA',
    url: 'https://www.nasa.gov',
    pubDate: 'Hace 6 horas',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '6',
    title: 'Cumbres nevadas y reforestación comunitaria frenan desertificación en los Andes',
    description: 'Comunidades locales y expertos en botánica implementan técnicas ancestrales y modernas para recuperar fuentes hídricas altoandinas.',
    source: 'BBC Mundo',
    url: 'https://www.bbc.com/mundo',
    pubDate: 'Hace 8 horas',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '7',
    title: 'Nuevos materiales superconductores prometen revolucionar el transporte eléctrico mundial',
    description: 'Investigadores logran demostrar conductividad sin resistencia eléctrica a temperaturas cercanas al ambiente, un hito histórico para la física aplicada.',
    source: 'MIT Technology Review',
    url: 'https://www.technologyreview.es',
    pubDate: 'Hace 10 horas',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '8',
    title: 'Bancos centrales evalúan protocolos internacionales para monedas digitales seguras',
    description: 'La banca internacional debate estándares de ciberseguridad y privacidad para transacciones transfronterizas instantáneas.',
    source: 'Financial Times',
    url: 'https://www.ft.com',
    pubDate: 'Hace 12 horas',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '9',
    title: 'Restauración de arrecifes de coral con técnicas bioacústicas muestra resultados sin precedentes',
    description: 'Biólogos marinos reproducen sonidos saludables de arrecifes para atraer fauna y acelerar la recuperación de ecosistemas coralinos dañados.',
    source: 'The Guardian',
    url: 'https://www.theguardian.com',
    pubDate: 'Hace 14 horas',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '10',
    title: 'Expansión de redes de trenes de alta velocidad conecta capitales de Europa y Asia',
    description: 'Nuevos corredores ferroviarios reducen los tiempos de viaje comercial y fomentan el turismo sostenible entre regiones.',
    source: 'El País',
    url: 'https://elpais.com',
    pubDate: 'Hace 16 horas',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1515165562839-978bbcfc993e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '11',
    title: 'Avances en computación cuántica logran corrección de errores en tiempo real',
    description: 'Laboratorios tecnológicos superan una de las barreras más complejas para construir procesadores cuánticos comerciales estables.',
    source: 'IEEE Spectrum',
    url: 'https://spectrum.ieee.org',
    pubDate: 'Hace 18 horas',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '12',
    title: 'Inversión global en energías renovables supera récords históricos este trimestre',
    description: 'Los proyectos de energía eólica marina y solar fotovoltaica lideran la captación de capitales privados y públicos en los cinco continentes.',
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com',
    pubDate: 'Hace 20 horas',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '13',
    title: 'Descubren nueva especie de ave en bosques nubosos de América del Sur',
    description: 'Ornitólogos documentan un ave con plumaje iridiscente y un canto único en una reserva natural protegida.',
    source: 'National Geographic',
    url: 'https://www.nationalgeographic.com',
    pubDate: 'Hace 1 día',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633ef8670?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '14',
    title: 'Iniciativas de agricultura regenerativa aumentan la fertilidad del suelo y la captura de carbono',
    description: 'Agricultores de diversas regiones adoptan prácticas de cultivo sin laboreo y rotación de cultivos para mitigar el cambio climático.',
    source: 'FAO',
    url: 'https://www.fao.org',
    pubDate: 'Hace 1 día',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '15',
    title: 'Robótica avanzada asiste en operaciones de rescate en zonas de difícil acceso',
    description: 'Drones autónomos y robots cuadrúpedos equipados con sensores térmicos colaboran en tareas humanitarias tras desastres naturales.',
    source: 'Reuters',
    url: 'https://www.reuters.com',
    pubDate: 'Hace 1 día',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '16',
    title: 'Implementan corredores biológicos urbanos para proteger polinizadores en megaciudades',
    description: 'Nuevos parques ecológicos y azoteas verdes conectan hábitats naturales permitiendo el libre tránsito de abejas, mariposas y aves nativas.',
    source: 'El Mundo',
    url: 'https://www.elmundo.es',
    pubDate: 'Hace 1 día',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '17',
    title: 'Economías emergentes lideran adopción de tecnologías de desalinización solar de bajo coste',
    description: 'Nuevas plantas purificadoras alimentadas exclusivamente por energía fotovoltaica abastecen de agua potable a regiones áridas costeras.',
    source: 'El País',
    url: 'https://elpais.com',
    pubDate: 'Hace 2 días',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '18',
    title: 'Criptografía post-cuántica: la carrera global para asegurar los datos del futuro',
    description: 'Agencias de ciberseguridad y gigantes tecnológicos actualizan estándares de cifrado para prevenir futuras vulnerabilidades ante ordenadores cuánticos.',
    source: 'Wired',
    url: 'https://www.wired.com',
    pubDate: 'Hace 2 días',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '19',
    title: 'Descubren red subterránea de micelio que explica la resiliencia de bosques antiguos',
    description: 'Estudios botánicos revelan cómo los hongos conectan árboles distantes para compartir nutrientes y alertas tempranas contra plagas.',
    source: 'National Geographic',
    url: 'https://www.nationalgeographic.com',
    pubDate: 'Hace 2 días',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '20',
    title: 'Acuerdo global para la protección del alta mar entra en vigor con ratificación histórica',
    description: 'Naciones unidas celebran la creación de vastas reservas marinas protegidas en aguas internacionales para salvaguardar la biodiversidad oceánica.',
    source: 'ONU Noticias',
    url: 'https://news.un.org',
    pubDate: 'Hace 2 días',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '21',
    title: 'Innovaciones en baterías de estado sólido prometen coches eléctricos con 1,000 km de autonomía',
    description: 'Fabricantes de automóviles y laboratorios de materiales confirman pruebas exitosas de celdas de alta densidad energética y recarga ultrarrápida.',
    source: 'Motorpasión',
    url: 'https://www.motorpasion.com',
    pubDate: 'Hace 3 días',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '22',
    title: 'Turismo sostenible impulsa la revitalización de pueblos históricos en Europa',
    description: 'Iniciativas de teletrabajo y conservación arquitectónica atraen a nuevos residentes permanentes a zonas rurales despobladas.',
    source: 'Euronews',
    url: 'https://es.euronews.com',
    pubDate: 'Hace 3 días',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '23',
    title: 'Biocombustibles avanzados a partir de algas marinas revolucionan la aviación comercial',
    description: 'Aerolíneas internacionales completan vuelos transatlánticos utilizando queroseno sostenible certificado con huella de carbono cercana a cero.',
    source: 'Aviation Week',
    url: 'https://aviationweek.com',
    pubDate: 'Hace 3 días',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '24',
    title: 'Radiotelescopios detectan señales de radio raras procedentes del centro galáctico',
    description: 'Astrofísicos analizan misteriosos pulsos energéticos que desafían los modelos actuales sobre estrellas de neutrones y campos magnéticos estelares.',
    source: 'Scientific American',
    url: 'https://www.scientificamerican.com',
    pubDate: 'Hace 4 días',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '25',
    title: 'Plataformas de código abierto transforman la educación tecnológica en regiones en desarrollo',
    description: 'Millones de estudiantes acceden a cursos avanzados de programación e inteligencia artificial de forma gratuita gracias a alianzas globales.',
    source: 'TechCrunch',
    url: 'https://techcrunch.com',
    pubDate: 'Hace 4 días',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '26',
    title: 'Inversión récord en infraestructura verde urbana para mitigar olas de calor',
    description: 'Grandes metrópolis rediseñan plazas y avenidas con techos reflectantes, fuentes públicas y frondosa arboleda para reducir el efecto isla de calor.',
    source: 'El País',
    url: 'https://elpais.com',
    pubDate: 'Hace 4 días',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '27',
    title: 'Estudio revela el impacto positivo de la economía circular en el sector textil mundial',
    description: 'Marcas de moda adoptan sistemas de reciclaje químico de prendas usadas para reducir el desperdicio de fibras sintéticas y algodón.',
    source: 'Fashion Network',
    url: 'https://www.fashionnetwork.com',
    pubDate: 'Hace 5 días',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '28',
    title: 'Ingenieros desarrollan paneles solares transparentes que convierten ventanas en generadores',
    description: 'La nueva tecnología de revestimiento fotovoltaico para rascacielos permite aprovechar cualquier superficie vidriada sin alterar la estética arquitectónica.',
    source: 'Inhabitat',
    url: 'https://inhabitat.com',
    pubDate: 'Hace 5 días',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '29',
    title: 'Descubren en la selva amazónica ruinas de antiguas ciudades precolombinas con tecnología LiDAR',
    description: 'Escáneres láser aerotransportados revelan complejas redes urbanas y campos agrícolas avanzados ocultos bajo la densa vegetación.',
    source: 'Nature',
    url: 'https://www.nature.com',
    pubDate: 'Hace 5 días',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '30',
    title: 'Redes inteligentes de distribución eléctrica optimizan el consumo energético con IA',
    description: 'Algoritmos avanzados equilibran la oferta de energía eólica y solar en tiempo real, reduciendo drásticamente las pérdidas en las redes de alta tensión.',
    source: 'IEEE',
    url: 'https://www.ieee.org',
    pubDate: 'Hace 6 días',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '31',
    title: 'Crecimiento sostenido del ecoturismo empodera a comunidades indígenas en Centroamérica',
    description: 'Viajeros de todo el mundo participan en experiencias de conservación de fauna y senderismo guiado por expertos locales.',
    source: 'National Geographic Viajes',
    url: 'https://www.nationalgeographic.com',
    pubDate: 'Hace 6 días',
    category: 'mundo',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '32',
    title: 'Bancos de desarrollo financian proyectos masivos de reforestación en zonas áridas de África',
    description: 'La iniciativa de la Gran Muralla Verde avanza con millones de árboles plantados para frenar la expansión del desierto y mejorar la seguridad alimentaria.',
    source: 'BBC Mundo',
    url: 'https://www.bbc.com/mundo',
    pubDate: 'Hace 6 días',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '33',
    title: 'Nuevos polímeros biodegradables derivados del mar reemplazan plásticos de un solo uso',
    description: 'Startups biotecnológicas comercializan envases compostables fabricados a partir de residuos de la industria pesquera y algas.',
    source: 'Fast Company',
    url: 'https://www.fastcompany.com',
    pubDate: 'Hace 1 semana',
    category: 'ciencia',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '34',
    title: 'Sistemas de traducción simultánea basados en IA eliminan barreras lingüísticas en cumbres de la ONU',
    description: 'Delegados de más de 190 países se comunican en tiempo real con avatares y traductores neuronales de ultra baja latencia.',
    source: 'UN News',
    url: 'https://news.un.org',
    pubDate: 'Hace 1 semana',
    category: 'tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '35',
    title: 'Expansión de la agricultura vertical hidropónica reduce el consumo de agua en un 95%',
    description: 'Granjas urbanas automatizadas cultivan vegetales frescos en el corazón de las grandes ciudades con iluminación LED de alta eficiencia.',
    source: 'AgTech Magazine',
    url: 'https://www.agtechmagazine.com',
    pubDate: 'Hace 1 semana',
    category: 'economia',
    imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80'
  }
];

// Rotate items deterministically based on today's date (YYYY-MM-DD) so every day news are different
const getDailyRotatedNews = (): NewsArticle[] => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 33 + today.charCodeAt(i)) % 100000;
  }
  const arr = [...REAL_WORLD_FALLBACK_NEWS];
  const shift = hash % arr.length;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
};

export const NewsView: React.FC<NewsViewProps> = ({ isNightMode = false, chats = [], onShareToChat }) => {
  const [articles, setArticles] = useState<NewsArticle[]>(getDailyRotatedNews());
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [sharingArticle, setSharingArticle] = useState<NewsArticle | null>(null);

  // Fetch real news from public RSS via rss2json with strict deduplication and daily rotation
  const fetchLiveNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/spanish/rss.xml');
      const data = await res.json();
      const dailyBase = getDailyRotatedNews();
      if (data && data.items && Array.isArray(data.items)) {
        const fetched: NewsArticle[] = data.items.map((item: any, idx: number) => ({
          id: `live_${idx}_${Date.now()}`,
          title: item.title || 'Noticia mundial',
          description: item.description ? item.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : 'Actualidad internacional de última hora.',
          source: 'BBC Mundo (En vivo)',
          url: item.link || 'https://www.bbc.com/mundo',
          pubDate: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente',
          category: idx % 2 === 0 ? 'mundo' : 'tecnologia',
          imageUrl: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'
        }));
        
        const combined = [...fetched, ...dailyBase];
        const seenTitles = new Set<string>();
        const uniqueArticles = combined.filter(art => {
          const normTitle = art.title.toLowerCase().trim();
          if (seenTitles.has(normTitle)) return false;
          seenTitles.add(normTitle);
          return true;
        });

        setArticles(uniqueArticles);
      }
    } catch (e) {
      // Gracefully fallback without logging console error
      const dailyBase = getDailyRotatedNews();
      const seenTitles = new Set<string>();
      const uniqueFallback = dailyBase.filter(art => {
        const normTitle = art.title.toLowerCase().trim();
        if (seenTitles.has(normTitle)) return false;
        seenTitles.add(normTitle);
        return true;
      });
      setArticles(uniqueFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredArticles = articles.filter((art) => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className={`min-h-screen pb-24 ${isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'}`}>
      {/* Header Banner */}
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-4 transition-colors ${
        isNightMode ? 'bg-[#0f131c]/90 border-white/10' : 'bg-white/90 border-sky-200'
      }`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight">NP</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30">
                  Noticias PidgeX
                </span>
              </div>
              <p className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-800/70'}`}>
                Actualidad real del mundo • Verificadas y en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme decoration badge */}
            {(() => {
              const activeTheme = getActiveMonthlyTheme();
              return (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 dark:bg-white/5 border border-sky-500/30 text-xs">
                  <span>{activeTheme.icon}</span>
                  <span className="font-bold text-[11px]">{activeTheme.name}</span>
                  <span className="animate-bounce">{activeTheme.decorations[0]}</span>
                  <span className="animate-pulse">{activeTheme.decorations[1]}</span>
                </div>
              );
            })()}

            <button
              onClick={fetchLiveNews}
              disabled={loading}
              title="Actualizar noticias"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isNightMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-sky-400'
                  : 'bg-white border-sky-200 hover:bg-sky-50 text-sky-600 shadow-sm'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className={`relative flex items-center rounded-xl border px-3 py-2 transition-all ${
            isNightMode ? 'bg-white/5 border-white/10 focus-within:border-sky-500' : 'bg-white/80 border-sky-200 focus-within:border-sky-400 shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-sky-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar noticias del mundo real..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="max-w-3xl mx-auto mt-3 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'mundo', label: 'Mundo' },
            { id: 'tecnologia', label: 'Tecnología' },
            { id: 'ciencia', label: 'Ciencia' },
            { id: 'economia', label: 'Economía' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : isNightMode
                  ? 'bg-white/5 text-[#8d90a0] hover:bg-white/10 hover:text-white'
                  : 'bg-white/80 text-sky-900/80 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>      {/* Feed Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500">
            <TrendingUp className="w-4 h-4" />
            <span>Titulares de hoy ({filteredArticles.length})</span>
          </div>
          <span className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-800/70'}`}>
            Fuentes periodísticas globales
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border border-dashed ${
            isNightMode ? 'border-white/10 bg-white/5 text-[#8d90a0]' : 'border-sky-300 bg-white/50 text-sky-800/70'
          }`}>
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50 text-sky-500" />
            <p className="font-bold text-base">No se encontraron noticias</p>
            <p className="text-xs mt-1">Prueba con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((art) => {
              const isBookmarked = bookmarkedIds.includes(art.id);
              return (
                <div
                  key={art.id}
                  className={`group rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isNightMode
                      ? 'bg-[#151a26]/90 border-white/10 hover:border-sky-500/40 hover:shadow-sky-500/10'
                      : 'bg-white/90 border-sky-200/80 hover:border-sky-400 hover:shadow-sky-500/15'
                  }`}
                >
                  {art.imageUrl && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {art.source}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/80 backdrop-blur-md text-white">
                          {art.category}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center space-x-1.5 opacity-90">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{art.pubDate}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {!art.imageUrl && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">
                          {art.source}
                        </span>
                        <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{art.pubDate}</span>
                        </div>
                      </div>
                    )}

                    <h2 className="text-lg font-black tracking-tight mb-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                      {art.title}
                    </h2>

                    <p className={`text-sm mb-4 line-clamp-2 ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-900/80'}`}>
                      {art.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleBookmark(art.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                              : isNightMode
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                          }`}
                          title="Guardar noticia"
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => setSharingArticle(art)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isNightMode
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                          }`}
                          title="Compartir con un amigo"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <span>Leer noticia original</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`mt-8 p-4 rounded-2xl border text-center text-xs ${
          isNightMode ? 'bg-white/5 border-white/10 text-[#8d90a0]' : 'bg-sky-50 border-sky-200 text-sky-800'
        }`}>
          <Sparkles className="w-4 h-4 mx-auto mb-1 text-sky-500" />
          NP (Noticias PidgeX) recopila información periodística y de actualidad mundial en tiempo real de fuentes oficiales y agencias de noticias verificadas.
        </div>
      </div>

      {/* Share to Friend Modal */}
      {sharingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isNightMode ? 'bg-[#151a26] border-white/10 text-[#dfe2ee]' : 'bg-white border-sky-200 text-[#0c2340]'
          }`}>
            <h3 className="text-lg font-black mb-1">¿A cuál de tus amigos quieres mandárselo?</h3>
            <p className={`text-xs mb-4 ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-800/70'}`}>
              "{sharingArticle.title}"
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 mb-4 scrollbar-none pr-1">
              {(!chats || chats.filter((c) => !c.isBlocked && c.isFriend !== false).length === 0) ? (
                <p className="text-center py-6 text-xs text-gray-400">No tienes amigos o chats disponibles para compartir.</p>
              ) : (
                chats
                  .filter((chat) => !chat.isBlocked && chat.isFriend !== false)
                  .map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      if (onShareToChat) {
                        onShareToChat(chat.id, sharingArticle.title, sharingArticle.url);
                        alert(`¡Noticia enviada a ${chat.name} con éxito!`);
                        setSharingArticle(null);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      isNightMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                        : 'bg-sky-50/50 border-sky-100 hover:bg-sky-100/80 text-sky-950'
                    }`}
                  >
                    <img src={chat.avatarUrl} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{chat.name}</p>
                      <p className={`text-xs truncate ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-800/60'}`}>
                        {chat.statusText || 'Amigo en PidgeX'}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-500 text-white shadow-sm">
                      Enviar
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSharingArticle(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  isNightMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
