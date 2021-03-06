import * as React from 'react';

import {
  InputNumber, Button
} from 'antd';

import './LineDashField.css';

// default props
interface LineDashFieldDefaultProps {
  label: string;
}

// non default props
interface LineDashFieldProps extends Partial<LineDashFieldDefaultProps> {
  dashArray?: number[];
  onChange: ((dashArray: number[]) => void);
}

// state
interface LineDashFieldState {
  dashArray: number[];
}

/**
 * LineDashField to edit dashes for LineSymbolizers
 */
class LineDashField extends React.Component<LineDashFieldProps, LineDashFieldState> {

  public static defaultProps: LineDashFieldDefaultProps = {
    label: 'Dash Pattern'
  };

  constructor(props: LineDashFieldProps) {
    super(props);
    this.state = {
      dashArray: props.dashArray || []
    };
  }

  static getDerivedStateFromProps(
    nextProps: LineDashFieldProps,
    prevState: LineDashFieldState): Partial<LineDashFieldState> {
      return {
        dashArray: nextProps.dashArray || []
      };
    }

  render() {
    const {
      label
    } = this.props;

    const {
      dashArray,
    } = this.state;

    return (
      <div className="editor-field linedash-field">
        <span className="label">{`${label}:`}</span>
        {
          dashArray.map((dash, idx) => <InputNumber
            key={idx}
            value={dash}
            min={1}
            step={1}
            style={{ width: 55 }}
            onChange={(value: number) => {
              // replace current dash value
              dashArray[idx] = value;
              this.setState({dashArray});
              this.props.onChange(dashArray);
            }}
          />)
        }
        <Button
          className="gs-add-dash-button"
          icon="plus"
          onClick={() => {
            // add a new dash (UI)
            dashArray.push(1);
            this.setState({dashArray});
            this.props.onChange(dashArray);
          }}
        />
        <Button
          className="gs-rm-dash-button"
          icon="minus"
          onClick={() => {
            // remove last dash (UI)
            dashArray.splice(dashArray.length - 1, 1);
            this.setState({dashArray});
            this.props.onChange(dashArray);
          }}
        />
      </div>
    );
  }
}

export default LineDashField;
