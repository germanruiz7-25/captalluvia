# Atribución de fuentes de datos

CaptaLluvia usa fuentes de datos gratuitas. Cada una se cita en la app y en los informes PDF.

| Fuente | Uso en CaptaLluvia | Condiciones |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) (reanálisis ERA5) | Serie diaria de lluvia en cualquier punto del mundo | Gratis para uso no comercial; datos bajo CC BY 4.0 |
| [NASA POWER](https://power.larc.nasa.gov/) | Serie de respaldo y verificación | "These data were obtained from the NASA Langley Research Center POWER Project funded through the NASA Earth Science Directorate Applied Science Program." |
| [CHIRPS 2.0](https://www.chc.ucsb.edu/data/chirps) — Climate Hazards Center, UC Santa Barbara | Climatología precalculada por municipio en Guatemala | Citar: Funk, C. et al. (2015). *Scientific Data* 2, 150066. doi:10.1038/sdata.2015.66 |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Mapa para ubicar la vivienda (desde v0.3.0) | © colaboradores de OpenStreetMap, ODbL; atribución visible en el mapa; [política de teselas](https://operations.osmfoundation.org/policies/tiles/) |
| [Nominatim](https://nominatim.org/) | Búsqueda de municipios y direcciones (desde v0.3.0) | Datos de OpenStreetMap, ODbL; máximo 1 consulta por segundo, sin autocompletar ([política](https://operations.osmfoundation.org/policies/nominatim/)) |
| [Leaflet](https://leafletjs.com/) | Biblioteca del mapa | Licencia BSD-2-Clause |
| [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) (ArcGIS Location Platform) | Mapa satelital (opcional, con clave) | "Powered by Esri" y proveedores (Esri, Maxar, Earthstar Geographics, GIS User Community) visibles en el mapa |
| [Mapbox Satellite Streets](https://www.mapbox.com/about/maps/) | Mapa satelital (opcional, con clave) | © Mapbox © OpenStreetMap y enlace "Mejorar este mapa"; revisar el requisito del logotipo de Mapbox |
| [MapTiler Hybrid](https://www.maptiler.com/copyright/) | Mapa satelital (opcional, con clave) | © MapTiler © colaboradores de OpenStreetMap; el plan gratuito es para uso no comercial y puede exigir el logotipo |
| [INSIVUMEH e ICC (2025)](https://icc.org.gt/wp-content/uploads/2023/03/265.pdf) — Curvas IDF de la vertiente del Pacífico | Intensidad de diseño de canaletas (22 estaciones, parámetros Gumbel) | Citar el documento; uso confirmado por los autores de CaptaLluvia (8 nov 2026) |
| [IDF Guatemala (Sherman)](https://ee-bardaleswa.projects.earthengine.app/view/idfguatemalasherman) — Walter Bardales | Consulta de la curva IDF del punto (enlace) | Citar al autor (uso confirmado, 8 nov 2026); los datos no se copian en la app |
| [Rotoplas Centroamérica](https://rotoplascentroamerica.com/) — Manual de instalación del tinaco | Capacidades y medidas de tanques de 450 a 2,500 L (referencia; dibujo genérico sin marca) | Citar la fuente |
| Estaciones aportadas por el usuario | Lluvia mensual o diaria cargada desde Excel o CSV (desde v0.6.0) | Responsabilidad de quien aporta los datos; la app cita la estación, sus coordenadas y el periodo |
| [PptxGenJS](https://github.com/gitbrent/PptxGenJS) | Presentación ejecutiva (.pptx) generada en el navegador | Licencia MIT |
| [docx](https://github.com/dolanmiu/docx) | Informe en Word (.docx) generado en el navegador | Licencia MIT |
| [read-excel-file](https://gitlab.com/catamphetamine/read-excel-file) | Lectura de archivos .xlsx en el navegador | Licencia MIT |
| [Meteostat](https://meteostat.net/) | Datos de estaciones (fase 3) | CC BY 4.0 |
| [RedMet del ICC](https://icc.org.gt/) | Estaciones de la vertiente del Pacífico (fase 3) | Según acuerdo con el ICC |

Desde la versión 0.1.0 se consulta Open-Meteo para estimar la lluvia del punto; las demás fuentes se incorporan en las fases siguientes.
