import PropTypes from 'prop-types'
import React from 'react';

// adapted from https://github.com/jxnblk/react-css-grid

const px = n => typeof n === 'number' ? n + 'px' : n

const styleWidth = (width) => ({
  gridTemplateColumns: `repeat(auto-fit, minmax(${px(width)}, 1fr))`
});

const gridGap = (gap) => ({
  gridGap: px(gap)
});

const gridAlign = (align) => align ? ({
  alignItems: props.align
}) : null

const gridColSpan = (span) => span ? ({
  gridColumn: `span ${span}`
}) : null;

const Grid = ({children, width, gap, align, ...props}) => { return <div {...props} style={{
  display: "grid",
  ...styleWidth(width),
  ...gridGap(gap),
  ...gridAlign(align)
}}>{children}</div> };

Grid.propTypes = {
  width: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  gap: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  align: PropTypes.string
};

Grid.defaultProps = {
  width: "10em",
  gap: "0.5em"
}

Grid.Item = ({children, span, ...props}) => {
  return <div {...props} style={{
    ...gridColSpan(span)
  }}>{children}</div>
}

export default Grid
