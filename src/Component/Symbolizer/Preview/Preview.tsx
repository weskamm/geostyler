import * as React from 'react';

import * as ol from 'openlayers';

import { Symbolizer, SymbolizerKind } from 'geostyler-style';

import './Preview.css';

import {
  Button
} from 'antd';

import 'openlayers/css/ol.css';
import './Preview.css';
import Editor from '../Editor/Editor';

import OlStyleParser from 'geostyler-openlayers-parser';
import {
  isEqual as _isEqual,
  get as _get
} from 'lodash';
import { Data } from 'geostyler-data';
import { DefaultCircleEditorProps } from '../CircleEditor/CircleEditor';
import { DefaultIconEditorProps } from '../IconEditor/IconEditor';
import { DefaultLineEditorProps } from '../LineEditor/LineEditor';
import { DefaultFillEditorProps } from '../FillEditor/FillEditor';
import { DefaultTextEditorProps } from '../TextEditor/TextEditor';

// default props
export interface DefaultPreviewProps {
  projection: string;
  dataProjection: string;
  showOsmBackground: boolean;
  mapHeight: number;
  map: ol.Map | undefined;
  layers: ol.layer.Base[] | undefined;
  controls: ol.control.Control[] | undefined;
  interactions: ol.interaction.Interaction[] | undefined;
  openEditorText: string;
  closeEditorText: string;
  unknownSymbolizerText?: string;
  circleEditorProps?: DefaultCircleEditorProps;
  iconEditorProps?: DefaultIconEditorProps;
  lineEditorProps?: DefaultLineEditorProps;
  fillEditorProps?: DefaultFillEditorProps;
  textEditorProps?: DefaultTextEditorProps;
}

// non default props
interface PreviewProps extends Partial<DefaultPreviewProps> {
  internalDataDef?: Data;
  symbolizer: Symbolizer;
  onSymbolizerChange: (symbolizer: Symbolizer) => void;
}

// state
interface PreviewState {
  symbolizer: Symbolizer;
  editorVisible: boolean;
  mapTargetId: string;
}

/**
 * Symbolizer preview UI.
 */
class Preview extends React.Component<PreviewProps, PreviewState> {

  /** reference to the underlying OpenLayers map */
  map: ol.Map;

  /** refrence to the vector layer for the passed in features  */
  dataLayer: ol.layer.Vector;

  public static defaultProps: DefaultPreviewProps = {
    projection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
    showOsmBackground: true,
    mapHeight: 267,
    map: undefined,
    layers: undefined,
    controls: undefined,
    interactions: undefined,
    openEditorText: 'Edit Symbolizer',
    closeEditorText: 'Close Editor'
  };

  constructor(props: PreviewProps) {
    super(props);

    const randomId = Math.floor((1 + Math.random()) * 0x10000);
    this.state = {
      editorVisible: false,
      symbolizer: props.symbolizer,
      mapTargetId: `map_${randomId}`
    };
  }

  static getDerivedStateFromProps(
      nextProps: PreviewProps,
      prevState: PreviewState): Partial<PreviewState> {

    return {
      symbolizer: nextProps.symbolizer
    };
  }

  componentDidUpdate(prevProps: PreviewProps, prevState: PreviewState) {
    if (this.dataLayer) {
      this.applySymbolizerToMapFeatures(this.state.symbolizer);
    }

    const features = this.props.internalDataDef ? this.props.internalDataDef.exampleFeatures : undefined;
    const prevFeatures = prevProps.internalDataDef ? prevProps.internalDataDef.exampleFeatures : undefined;
    if (!_isEqual(features, prevFeatures) ||
       !_isEqual(this.state.symbolizer.kind, prevState.symbolizer.kind)) {
      this.updateFeatures();
    }
  }

  updateFeatures() {
    // Remove previous features
    this.dataLayer.getSource().clear();

    const format = new ol.format.GeoJSON({
      defaultDataProjection: this.props.dataProjection,
      featureProjection: this.map.getView().getProjection()
    });
    // add data features to style according to symbolizer and zoom to them (when existing)
    if (this.props.internalDataDef && this.props.internalDataDef.exampleFeatures) {
      const olFeatures = format.readFeatures(this.props.internalDataDef.exampleFeatures);
      this.dataLayer.getSource().addFeatures(olFeatures);
    // create a simple feature to see the symbolizer anyway
    } else {
      const geom = this.getSampleGeomFromSymbolizer();
      const sampleFeature = new ol.Feature({
        geometry: geom.transform('EPSG:4326', 'EPSG:3857'),
        Name: 'Sample Feature'
      });
      this.dataLayer.getSource().addFeature(sampleFeature);
    }

    // zoom to feature extent
    const extent = this.dataLayer.getSource().getExtent();
    this.map.getView().fit(extent, {
      maxZoom: 20
    });
  }

  public componentDidMount() {
    let map: ol.Map;
    if (!this.props.map) {
      // create a new OL map and bind it to this preview DIV
      map = new ol.Map({
        layers: [],
        controls: [],
        interactions: [],
        target: this.state.mapTargetId,
        view: new ol.View({
          projection: this.props.projection
        })
      });
    } else {
      // use passed in OL map and bind it to this preview DIV
      map = this.props.map;
      map.setTarget(this.state.mapTargetId);
    }

    // show an OSM background layer if configured and no map was passed in
    if (!this.props.map && this.props.showOsmBackground) {
      const osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
      });
      map.addLayer(osmLayer);
    }

    // add configured OL control to map, when no map was passed in
    if (!this.props.map && this.props.controls) {
      this.props.controls.forEach((ctrl) => {
        map.addControl(ctrl);
      });
    }

    // add configured OL interaction to map, when no map was passed in
    if (!this.props.map && this.props.interactions) {
      this.props.interactions.forEach((iac) => {
        map.addInteraction(iac);
      });
    }

    // add configured additional layers
    if (this.props.layers) {
      this.props.layers.forEach((layer) => {
        map.addLayer(layer);
      });
    }

    const vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    });

    map.addLayer(vectorLayer);
    this.dataLayer = vectorLayer;

    this.map = map;
    this.updateFeatures();
    this.applySymbolizerToMapFeatures(this.state.symbolizer);
  }

  getSampleGeomFromSymbolizer = () => {
    const kind: SymbolizerKind = _get(this.state, 'symbolizer.kind');
    switch (kind) {
      case 'Circle':
      case 'Icon':
      case 'Text':
        return new ol.geom.Point([7.10066, 50.735851]);
      case 'Fill':
        return new ol.geom.Polygon([[
            [7.1031761169433585, 50.734268655851345],
            [7.109270095825195, 50.734268655851345, ],
            [7.109270095825195, 50.73824770380063],
            [7.1031761169433585, 50.73824770380063],
            [7.1031761169433585, 50.734268655851345, ]
          ]]);
      case 'Line':
        return new ol.geom.LineString([
          [7.062578201293945, 50.721786104206004],
          [7.077512741088867, 50.729610159968296],
          [7.082319259643555, 50.732435192351126],
          [7.097940444946289, 50.73748722929948],
          [7.106866836547852, 50.73775882875318],
          [7.117509841918945, 50.73889952925885],
          [7.129182815551758, 50.7504679214779]
        ]);
      default:
        return new ol.geom.Point([7.10066, 50.735851]);
    }
  }

  /**
   *
   */
  onEditButtonClicked = () => {
    this.setState({
      editorVisible: !this.state.editorVisible
    });
  }

  /**
   * Transforms the incoming symbolizer to an OpenLayers style object the
   * GeoStyler parser and applies it to the vector features on the map.
   *
   * @param {Symbolizer} symbolizer The symbolizer as holding the style to apply
   */
  applySymbolizerToMapFeatures = (symbolizer: Symbolizer): any => {

    const styleParser = new OlStyleParser();

    // we have to wrap the symbolizer in a Style object since the writeStyle
    // only accepts a Style object
    const style = {
      name: 'WrapperStyle4Symbolizer',
      rules: [{
        symbolizer: symbolizer
      }]
    };

    // parser style to OL style
    styleParser.writeStyle(style)
      .then((olStyles: ol.style.Style[]) => {
        // apply new OL style to vector layer
        this.dataLayer.setStyle(olStyles[0]);
        return olStyles[0];
      });
  }

  render() {
    const {
      mapHeight,
      openEditorText,
      closeEditorText,
      projection,
      map,
      controls,
      interactions,
      dataProjection,
      showOsmBackground,
      ...editorProps
    } = this.props;

    return (
      <div className="gs-symbolizer-preview" >
        <div
          id={this.state.mapTargetId}
          className="map"
          style={{ height: mapHeight }}
        >
          <Button
            className="gs-edit-preview-button"
            icon="edit"
            onClick={this.onEditButtonClicked}
          >
            {this.state.editorVisible ? closeEditorText : openEditorText}
          </Button>
          {
            this.state.editorVisible ?
              <Editor
                {...editorProps}
              /> : null
          }
        </div>
      </div>
    );
  }
}

export default Preview;
