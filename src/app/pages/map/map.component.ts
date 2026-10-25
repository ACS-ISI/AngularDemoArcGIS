import { Component, CUSTOM_ELEMENTS_SCHEMA, output, signal } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";

import "@arcgis/map-components/components/arcgis-map";
import type { ArcgisMap } from "@arcgis/map-components/components/arcgis-map";

import esriConfig from "@arcgis/core/config";
import EsriMap from "@arcgis/core/Map";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import RouteParameters from "@arcgis/core/rest/support/RouteParameters";
import type RouteSolveResult from "@arcgis/core/rest/support/RouteSolveResult";
import * as route from "@arcgis/core/rest/route";

// Routing (route-api.arcgis.com) requires an ArcGIS API key. Leave this commented out
// until you have a real key: an invalid key makes every ArcGIS Online request fail,
// including the public feature layers and basemap.
// esriConfig.apiKey = "YOUR_API_KEY";

const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

interface IDirection {
  text: string;
  length: number;
}

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  imports: [NgIf, NgFor],
  styleUrl: "./map.component.scss",
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapComponent {
  readonly mapLoadedEvent = output<boolean>();

  readonly zoom = 10;
  readonly center = [-118.73682450024377, 34.07817583063242];
  readonly basemap = "streets-vector";

  readonly trailheadsLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0",
    outFields: ['*']
  });
  readonly graphicsLayerUserPoints = new GraphicsLayer({ title: "points" });
  readonly graphicsLayerRoutes = new GraphicsLayer({ title: "routes" });

  readonly map = new EsriMap({ basemap: this.basemap });

  readonly directions = signal<IDirection[]>([]);

  private mapElement?: ArcgisMap;

  constructor() {
    this.addFeatureLayers();
    this.addGraphicsLayers();
  }

  addFeatureLayers() {
    const trailsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
    });
    const parksLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
    });
    this.map.addMany([parksLayer, trailsLayer, this.trailheadsLayer]);
    console.log("Feature layers added");
  }

  addGraphicsLayers() {
    this.map.addMany([this.graphicsLayerUserPoints, this.graphicsLayerRoutes]);
  }

  onViewReady(event: Event) {
    this.mapElement = event.target as ArcgisMap;
    const view = this.mapElement.view;

    view.on("pointer-move", ["Shift"], (pointerEvent) => {
      const point = view.toMap({ x: pointerEvent.x, y: pointerEvent.y });
      console.log("Map pointer moved: ", point?.longitude, point?.latitude);
    });

    console.log("ArcGIS map loaded");
    this.mapLoadedEvent.emit(true);
  }

  async onViewClick(event: Event) {
    if (!this.mapElement) {
      return;
    }
    const { detail } = event as ArcgisMap["arcgisViewClick"];
    const response = await this.mapElement.hitTest(detail, { include: this.trailheadsLayer });
    const result = response.results.find((r) => r.type === "graphic");
    const point = result?.mapPoint;
    if (!point) {
      return;
    }

    console.log("get selected point: ", response, point);
    const pointCount = this.graphicsLayerUserPoints.graphics.length;
    if (pointCount === 0) {
      this.addPoint(point.latitude, point.longitude);
    } else if (pointCount === 1) {
      this.addPoint(point.latitude, point.longitude);
      this.calculateRoute();
    } else {
      this.removePoints();
    }
  }

  addPoint(lat: number | null | undefined, lng: number | null | undefined) {
    const pointGraphic = new Graphic({
      geometry: new Point({
        longitude: lng ?? undefined,
        latitude: lat ?? undefined
      }),
      symbol: {
        type: "simple-marker",
        color: [226, 119, 40],  // Orange
        outline: {
          color: [255, 255, 255], // White
          width: 1
        }
      }
    });

    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  removePoints() {
    this.graphicsLayerUserPoints.removeAll();
  }

  removeRoutes() {
    this.graphicsLayerRoutes.removeAll();
  }

  async calculateRoute() {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: this.graphicsLayerUserPoints.graphics.toArray()
      }),
      returnDirections: true
    });

    try {
      const data = await route.solve(routeUrl, routeParams);
      this.displayRoute(data);
    } catch (error) {
      console.error("Error calculating route: ", error);
      alert("Error calculating route");
    }
  }

  displayRoute(data: RouteSolveResult) {
    for (const result of data.routeResults) {
      if (result.route) {
        result.route.symbol = {
          type: "simple-line",
          color: [5, 150, 255],
          width: 3
        } as any;
        this.graphicsLayerRoutes.add(result.route);
      }
    }
    const features = data.routeResults[0]?.directions?.features;
    if (features?.length) {
      this.directions.set(features.map((f) => ({ text: f.attributes.text, length: f.attributes.length })));
    } else {
      alert("No directions found");
    }
  }

  clearRouter() {
    // Remove all graphics related to routes
    this.removeRoutes();
    this.removePoints();
    this.directions.set([]);
    console.log("Route cleared");
  }
}
