import * as React from 'react';

import {
  Select
} from 'antd';
const Option = Select.Option;

// default props
interface FontPickerDefaultProps {
  label: string;
  fontOptions: string[];
}

// non default props
interface FontPickerProps extends Partial<FontPickerDefaultProps> {
  onChange: ((fonts: string[]) => void);
  font?: string[];
}

/**
 * FontPicker to select font types / families
 */
class FontPicker extends React.Component<FontPickerProps, {}> {

  public static defaultProps: FontPickerDefaultProps = {
    label: 'Font',
    fontOptions: [
      'Arial', 'Verdana', 'Sans-serif',
      'Courier New', 'Lucida Console', 'Monospace',
      'Times New Roman', 'Georgia', 'Serif'
    ]
  };

  render() {
    const {
      font,
      label,
      fontOptions
    } = this.props;

    const children: JSX.Element[] = [];
    if (fontOptions) {
      fontOptions.forEach(fontOpt => {
        children.push(<Option key={fontOpt}>{fontOpt}</Option>);
      });
    }

    return (
      <div className="editor-field font-picker">
        <span className="label">{`${label}:`}</span>
        <Select
          mode="tags"
          value={font}
          onChange={this.props.onChange}
        >
          {children}
        </Select>
      </div>
    );
  }
}

export default FontPicker;
