===== Laboratorul 04. Dezvoltarea unei aplicații web cu Angular framework =====

==== Obiective laborator ====
  * Înțelegerea modului de integrare a API-ului ArcGIS într-un framework de JavaScript
  * Înțelegerea modului de integrare a funcționalităților ArcGIS în Angular
    * Structură modulară a codului (componente standalone, rutare)
    * Integrarea ArcGIS prin modulele ES din ''@arcgis/core'' și componenta ''<arcgis-map>'' din ''@arcgis/map-components''
  * Exersarea modului de lucru cu elemente grafice pe hartă

==== Introducere in Angular ====

Pentru a realiza proiecte mai complexe (majoritatea aplicațiilor web moderne), se folosesc în general framework-uri de JavaScript, precum Angular, React sau Vue. [[https://angular.dev/overview|What is Angular?]]

Acestea permit realizarea aplicațiilor de tip SPA ([[https://en.wikipedia.org/wiki/Single-page_application|Single Page Application]]) având o structură modulară (model MVC sau MVVM) și un set de facilități standard precum rutare, interacțiune cu DOM-ul (Document Object Model), layout flexibil, componente vizuale reutilizabile (ex. [[https://material.angular.dev/|Angular Material]]), optimizare build. Principalul avantaj este că oferă o structură standard ce permite extensibilitatea codului (în comparație cu vanilla JS, unde putem ajunge foarte ușor la un spaghetti code).

Angular prezintă un avantaj major față de celelalte framework-uri: folosește TypeScript, o extensie a JavaScript-ului care combină avantajele unui limbaj puternic tipizat (strongly typed) cu flexibilitatea limbajului JavaScript (în esență weakly typed), și permite folosirea conceptelor OOP într-o arhitectură de tip MVVM ([[https://whatis.techtarget.com/definition/Model-View-ViewModel|Model-View-ViewModel]]).

{{:isi:laboratoare:lab4:mvvm.png?500|}}

<note important>Angular este un framework pentru aplicații enterprise cu o structură bine definită, fapt pentru care necesită un timp de învățare suplimentar pentru asimilarea conceptelor fundamentale. Nu este neapărat ușor de învățat dacă nu aveți deja ceva experiență cu JavaScript, dar oferă un cadru structurat și există documentație consistentă și tutoriale interactive.

Tutorial practic introductiv: [[https://angular.dev/tutorials/learn-angular|Angular - Learn Angular (tutorial interactiv)]]
</note>

<note tip>
[[https://material.angular.dev/components/categories|Angular Material]] este o colecție de componente de UI standardizate care se pot integra ușor într-o aplicație Angular. Acestea presupun niste elemente HTML cu funcționalitate integrată. În proiect folosim bara de navigare cu tab-uri (''mat-tab-nav-bar'').
</note>

==== Ce s-a schimbat față de laboratorul trecut ====

În [[isi:laboratoare:03|Laboratorul 03]] ați rulat proiectul Angular de pe GitHub (Task 3). Acel proiect folosea **Angular 14** și **ArcGIS Maps SDK 4.28**, versiuni de acum câțiva ani. Pentru acest laborator am **actualizat proiectul la versiunile curente**. Funcționalitatea este aceeași (hartă cu trasee, rutare între două trailheads, buton de ștergere a rutei), dar codul arată diferit.

<note>Descărcați din nou proiectul de pe GitHub: [[https://github.com/alexp25/AngularDemoArcGIS|AngularDemoArcGIS]]. Dacă refolosiți folderul din laboratorul trecut, ștergeți ''node_modules'' și rulați din nou ''npm install''.</note>

^ ^ Laboratorul 03 ^ Laboratorul 04 (acum) ^
^ Angular (+ Angular Material) | 14 | 21 |
^ ArcGIS Maps SDK (''@arcgis/core'') | 4.28 | 5.1 |
^ Harta | ''new MapView({ container: div })'' în ''.ts'' | componenta ''<arcgis-map>'' în ''.html'' |
^ Structura aplicației | ''app.module.ts'' (NgModule) | componente standalone + ''app.config.ts'' |
^ TypeScript | 4.7 | 5.9 (mod ''strict'') |
^ Build | Webpack | esbuild + Vite |
^ Teste | Karma + Jasmine | Vitest |

=== Legătura cu ce ați făcut în CodePen ===

Vestea bună: în CodePen (Laboratorul 03) ați lucrat deja cu componenta ''<arcgis-map>'' și cu evenimentul ''arcgisViewClick''. **Proiectul Angular folosește acum exact același mecanism**, doar că legăturile se fac din template-ul Angular, nu cu ''querySelector'' și ''addEventListener'':

^ CodePen (Laboratorul 03) ^ Angular (Laboratorul 04) ^
| ''<script type="module" src="https://js.arcgis.com/5.1/">'' | ''import "@arcgis/map-components/components/arcgis-map";'' |
| ''<arcgis-map basemap="..." center="..." zoom="...">'' | ''<arcgis-map [map]="map" [center]="center" [zoom]="zoom">'' |
| ''const viewElement = document.querySelector("arcgis-map");'' | elementul vine în ''event.target'' (vezi ''onViewReady'') |
| ''viewElement.addEventListener("arcgisViewClick", (event) => ...)'' | ''(arcgisViewClick)="onViewClick($event)"'' |
| ''await view.hitTest(event.detail)'' | ''await this.mapElement.hitTest(detail, { include: this.trailheadsLayer })'' |
| ''require(["esri/..."])'' / ''$arcgis.import(...)'' | ''import X from "@arcgis/core/..."'' |

Logica de la Task 2 din laboratorul trecut (cu ''hitTest'' decidem ce s-a apăsat pe hartă) este folosită și aici: rutarea pornește doar când utilizatorul face click pe un trailhead.

=== Cum arată acum pagina cu harta ===

''src/app/pages/map/map.component.html'':
<code html>
<div class="container">
    <arcgis-map class="map-view" [map]="map" [center]="center" [zoom]="zoom"
        (arcgisViewReadyChange)="onViewReady($event)" (arcgisViewClick)="onViewClick($event)">
        <ol *ngIf="directions().length > 0" slot="top-right"
            class="esri-widget esri-widget--panel esri-directions__scroller directions">
            <li *ngFor="let direction of directions()">{{ direction.text }} ({{ direction.length }} miles)</li>
        </ol>
    </arcgis-map>
</div>

<button class="fab" (click)="clearRouter()">x</button>
</code>

''src/app/pages/map/map.component.ts'' (fragmente):
<code typescript>
import "@arcgis/map-components/components/arcgis-map";
import EsriMap from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as route from "@arcgis/core/rest/route";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  imports: [NgIf, NgFor],
  styleUrl: "./map.component.scss",
  schemas: [CUSTOM_ELEMENTS_SCHEMA]   // permite elemente HTML care nu sunt componente Angular (<arcgis-map>)
})
export class MapComponent {
  readonly map = new EsriMap({ basemap: "streets-vector" });
  readonly directions = signal<IDirection[]>([]);   // lista de indicații afișată în template

  onViewReady(event: Event) {
    this.mapElement = event.target as ArcgisMap;     // echivalentul lui querySelector("arcgis-map")
  }

  async onViewClick(event: Event) {
    const { detail } = event as ArcgisMap["arcgisViewClick"];
    const response = await this.mapElement.hitTest(detail, { include: this.trailheadsLayer });
    ...
  }
}
</code>

=== Structura proiectului ===

<code>
src/
  index.html                  pagina HTML în care se încarcă aplicația (<app-root>)
  main.ts                     punctul de pornire: bootstrapApplication(...)
  styles.scss                 stiluri globale
  app/
    app.config.ts             configurarea aplicației (providers: rutare etc.)      [NOU, înlocuiește app.module.ts]
    app.routes.ts             rutele aplicației (/home, /map)                       [NOU, înlocuiește app-routing.module.ts]
    app.component.*           componenta rădăcină: bara de navigare + <router-outlet>
    pages/
      home/home.component.*   pagina de start
      map/map.component.*     pagina cu harta ArcGIS (aici veți lucra)
angular.json                  configurarea build-ului (inclusiv CSS-ul ArcGIS / Calcite)
package.json                  dependențele proiectului și scripturile npm
</code>

Fiecare componentă are 3 fișiere: ''.ts'' (logica, clasa componentei), ''.html'' (template-ul) și ''.scss'' (stilurile, aplicate doar acelei componente).

Au dispărut: ''app.module.ts'', ''app-routing.module.ts'', ''polyfills.ts'', ''environments/'', ''karma.conf.js'', ''tslint.json'', ''extra-webpack.config.js'' și folderul ''e2e/''.

==== Schimbările pe larg ====

Mai jos sunt explicate principalele schimbări, comparând codul din proiectul de la Laboratorul 03 cu cel actual. Sunt utile și dacă urmăriți tutoriale mai vechi de pe internet, care folosesc încă vechile API-uri.

=== Angular (14 → 21) ===

**1. Componente standalone în loc de NgModule**

În proiectul vechi, fiecare componentă trebuia declarată într-un modul (''app.module.ts''), iar modulele importau alte module. Acum componentele sunt **standalone**: fiecare componentă își declară singură dependențele prin proprietatea ''imports''.

Laboratorul 03:
<code typescript>
@NgModule({
  declarations: [AppComponent, HomeComponent, MapComponent],
  imports: [BrowserModule, AppRoutingModule, MatTabsModule],
  bootstrap: [AppComponent]
})
export class AppModule { }

// main.ts
platformBrowserDynamic().bootstrapModule(AppModule);
</code>

Acum:
<code typescript>
@Component({
  selector: 'app-root',
  imports: [NgFor, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent { ... }

// main.ts
bootstrapApplication(AppComponent, appConfig);
</code>

<note important>Dacă folosiți într-un template o directivă sau o componentă (ex. ''*ngIf'', ''*ngFor'', ''routerLink'', ''mat-tab-link''), trebuie să o adăugați în lista ''imports'' a componentei respective. Altfel veți primi o eroare de compilare.</note>

**2. Configurare și rutare: ''app.config.ts'' și ''app.routes.ts''**

Serviciile globale (ex. router-ul) se înregistrează în ''app.config.ts'' prin funcții de tip ''provideXxx()'', în loc de ''RouterModule.forRoot(...)'' într-un modul:
<code typescript>
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
</code>

Pagina cu harta se încarcă acum **lazy** (doar când utilizatorul navighează la ''/map''). Biblioteca ArcGIS este mare, iar astfel pagina de start se încarcă mult mai repede:
<code typescript>
{
  path: 'map',
  loadComponent: () => import('./pages/map/map.component').then((m) => m.MapComponent),
}
</code>

**3. Signals**

Un **signal** este o valoare reactivă: când o modificați, Angular actualizează automat părțile din template care o folosesc. Se citește apelând-o ca pe o funcție și se modifică cu ''.set()'':
<code typescript>
readonly directions = signal<IDirection[]>([]);

this.directions.set([...]);       // modificare
const list = this.directions();   // citire (și în template: directions())
</code>

<note>Aplicația rulează fără ''zone.js'' (modul **zoneless**, implicit începând cu Angular 21). În proiectul vechi, Angular detecta automat orice modificare a variabilelor. Acum, pentru ca template-ul să se actualizeze când datele se schimbă în afara unui eveniment din template (ex. după un apel către serviciul de rutare), folosiți signals.</note>

**4. Alte schimbări în componente**
  * ''@Output() x = new EventEmitter<T>()'' devine ''readonly x = output<T>()''
  * ''styleUrls: [...]'' devine ''styleUrl: '...' '' (un singur fișier)
  * TypeScript rulează în mod ''strict'': variabilele trebuie inițializate, iar valorile care pot fi ''null'' / ''undefined'' trebuie verificate (ex. ''point?.longitude'')

**5. Template-uri: ''*ngIf'' și ''*ngFor''**

Rămânem la directivele clasice ''*ngIf'' și ''*ngFor'', ca în proiectul vechi. Singura diferență este că acum trebuie importate (''NgIf'', ''NgFor'' din ''@angular/common'') în lista ''imports'' a componentei.

<note tip>În documentația oficială recentă veți întâlni și o sintaxă nouă, numită "control flow" (''@if (...) { }'', ''@for (...; track ...) { }''), care face același lucru fără import. Ambele variante funcționează în Angular 21.</note>

**6. Build și tooling**
  * Build-ul folosește **esbuild + Vite** în loc de Webpack (compilare mult mai rapidă, reload aproape instant).
  * CSS-ul bibliotecilor externe (Angular Material, Calcite, ArcGIS) se declară în ''angular.json'' la ''styles''.
  * Testele unitare rulează cu **Vitest**: ''npm test''.

=== ArcGIS Maps SDK for JavaScript (4.28 → 5.1) ===

**1. Map Components: ''<arcgis-map>'' în loc de ''new MapView(...)''**

În proiectul vechi, harta era creată din cod, într-un ''<div #mapViewNode>''. Acum harta se declară direct în HTML, ca în CodePen.

Laboratorul 03 (''map.component.ts''):
<code typescript>
this.map = new WebMap({ basemap: "streets-vector" });
this.view = new MapView({
  container: this.mapViewEl.nativeElement,   // un <div #mapViewNode>
  center: this.center,
  zoom: this.zoom,
  map: this.map
});
await this.view.when();
</code>

Acum (''map.component.html''):
<code html>
<arcgis-map [map]="map" [center]="center" [zoom]="zoom"
    (arcgisViewReadyChange)="onViewReady($event)" (arcgisViewClick)="onViewClick($event)">
</arcgis-map>
</code>

Obiectul ''Map'' (cu layerele) se creează în continuare cu ''@arcgis/core'': ''new Map({ basemap: ... })'', ''map.add(layer)''. View-ul (''MapView'') este creat de componentă și poate fi accesat prin ''mapElement.view'', după evenimentul ''arcgisViewReadyChange''.

**2. Evenimente**

^ Laboratorul 03 ^ Acum ^
| ''view.when()'' | ''(arcgisViewReadyChange)'' |
| ''view.on("click", ...)'' | ''(arcgisViewClick)'' |
| ''view.on("pointer-move", ...)'' | ''(arcgisViewPointerMove)'' |
| ''view.hitTest(event)'' | ''mapElement.hitTest(event.detail, { include: layer })'' |

Datele evenimentului se află în ''event.detail''.

**3. Widget-uri → componente**

Clasele widget din ''@arcgis/core/widgets/...'' (ex. ''Bookmarks'', ''Expand'', ''Legend'', ''Search'') sunt depreciate în favoarea componentelor echivalente. Acestea se poziționează pe hartă cu atributul ''slot'', în loc de ''view.ui.add(...)'':

Laboratorul 03:
<code typescript>
const legend = new Legend({ view: this.view });
this.view.ui.add(legend, "bottom-left");
</code>

Acum:
<code html>
<arcgis-map ...>
  <arcgis-zoom slot="top-left"></arcgis-zoom>
  <arcgis-legend slot="bottom-left"></arcgis-legend>
</arcgis-map>
</code>

Fiecare componentă folosită trebuie importată în ''.ts'', ex. ''import "@arcgis/map-components/components/arcgis-legend";''. Lista completă: [[https://developers.arcgis.com/javascript/latest/references/map-components/|Map Components reference]].

Același mecanism îl folosim pentru panoul cu indicațiile de rutare. În proiectul vechi, elementul ''<ol>'' era construit manual cu ''document.createElement(...)'' și adăugat cu ''view.ui.add''. Acum îl scriem direct în template-ul Angular, cu ''slot="top-right"'' și ''*ngFor''.

**4. Calcite Design System**

Componentele ArcGIS sunt construite peste [[https://developers.arcgis.com/calcite-design-system/|Calcite Components]] (''@esri/calcite-components''), biblioteca de UI a Esri. O puteți folosi și voi pentru butoane, panouri, liste etc. (ex. ''<calcite-button>'').

**5. API key**

<note warning>În versiunea 5.x, dacă setați ''esriConfig.apiKey'' cu o valoare invalidă (ex. textul ''"YOUR_API_KEY"''), **toate** cererile către ArcGIS Online eșuează, inclusiv cele pentru basemap și layerele publice, iar harta apare goală. Din acest motiv linia este comentată în proiect. Decomentați-o doar după ce puneți cheia voastră reală.</note>

==== Setup și rulare proiect ====

<note warning>Ați făcut setup-ul în laboratorul trecut, dar proiectul a fost actualizat la Angular 21. Verificați versiunea de Node.js și reinstalați dependențele.</note>

=== Node.js și NPM ===

Instalați versiunea LTS de aici, dacă nu aveți deja instalat Node.js: https://nodejs.org/en/

<note important>Angular 21 necesită Node.js **^20.19**, **^22.12** sau **>=24**. Recomandăm ultima versiune **Node 24 (LTS)**. Verificați versiunea instalată cu ''node -v''.</note>

=== Angular CLI (opțional) ===

Angular CLI (comanda ''ng'') este inclus deja în dependențele proiectului și se poate folosi prin ''npx ng ...''. Dacă ați instalat global o versiune mai veche în laboratorul trecut și vreți comanda ''ng'' disponibilă global, actualizați-o:

<code>
npm install -g @angular/cli@21
</code>

=== Instalare dependențe și rulare ===

În folder-ul proiectului deschideți un terminal (e.g. PowerShell, shift+click dreapta / Open PowerShell window here) și rulați:

<code>
npm install
npm run start
</code>

Dacă totul este ok, se va deschide un server pe portul 4200: http://localhost:4200/. Serverul face reload automat la fiecare modificare salvată în cod.

Alte comenzi utile:
<code>
npm run build    # build de producție, în folderul dist/
npm test         # rulează testele unitare (Vitest)
</code>

==== Task ====

=== Task 1 ===

Rulați aplicația actualizată și comparați codul din ''src/app/pages/map/'' cu cel pe care l-ați văzut în laboratorul trecut. Verificați funcția de rutare între două puncte negre, capete de traseu (trailheads) pe hartă.

<note important>Adăugați API key-ul din contul ArcGIS Developer: în ''src/app/pages/map/map.component.ts'' decomentați linia ''esriConfig.apiKey = "YOUR_API_KEY";'' și înlocuiți valoarea cu cheia voastră. Fără cheie, harta și layerele se afișează, dar serviciul de rutare nu funcționează.</note>

Urmăriți în cod fluxul: ''(arcgisViewClick)'' → ''onViewClick()'' → ''hitTest'' pe layerul de trailheads → ''addPoint()'' → ''calculateRoute()'' → ''displayRoute()''.

=== Task 2 ===
Adăugați elementele grafice din [[isi:laboratoare:02|Laboratorul 02]]: poligon, punct si polilinie (ex. GraphicsLayer).
Indicatie: folositi metoda de instanţiere cu new Polyline(...), new Point(...), etc. Importați clasele din ''@arcgis/core'' (ex. ''import Polygon from "@arcgis/core/geometry/Polygon";'') și adăugați graficele într-un ''GraphicsLayer'' nou, adăugat pe hartă în ''addGraphicsLayers()''. Exemplu:
<code typescript>
const polygon = new Polygon({
  rings: [
    [
      [-118.818984489994, 34.0137559967283],
      [-118.806796597377, 34.0215816298725],
      [-118.791432890735, 34.0163883241613],
      [-118.79596686535, 34.008564864635],
      [-118.808558110679, 34.0035027131376]
    ]
  ]
});
</code>

=== Task 3 ===
Urmăriți modul de integrare a serviciului de rutare în componenta Angular. În mod similar, adăugați serviciul de căutare a locațiilor ([[https://developers.arcgis.com/javascript/latest/tutorials/find-places/|Place search]]) pe baza unei categorii predefinite, pe care l-ați testat deja în CodePen în laboratorul trecut.

Indicații:
  * modulul pentru căutare este ''@arcgis/core/rest/places'' (similar cu ''@arcgis/core/rest/route'' folosit pentru rutare)
  * salvați rezultatele într-un ''signal'' și afișați-le într-o listă cu ''*ngFor'', poziționată pe hartă cu ''slot="top-right"'' (urmăriți cum este afișat panoul cu indicațiile de rutare în ''map.component.html'')

{{:isi:laboratoare:lab4:l4_1.png?800|}}

==== Resurse ====

  * [[https://developers.arcgis.com/javascript/latest/references/core/|ArcGIS Maps SDK for JavaScript 5.1 - Core API reference]]
  * [[https://developers.arcgis.com/javascript/latest/references/map-components/|ArcGIS Map Components reference]]
  * [[https://developers.arcgis.com/javascript/latest/sample-code/|ArcGIS Maps SDK - Samples]]
  * [[https://developers.arcgis.com/calcite-design-system/|Calcite Design System]]
  * [[https://angular.dev/overview|What is Angular]]
  * [[https://angular.dev/guide/components|Angular - Components]]
  * [[https://angular.dev/guide/signals|Angular - Signals]]
  * [[https://github.com/alexp25/AngularDemoArcGIS|GitHub: AngularDemoArcGIS]]
