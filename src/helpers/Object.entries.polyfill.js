

export default function entries( obj ){
  var ownProps = Object.keys( obj ),
    i = ownProps.length,
    resArray = new Array(i); // preallocate the Array
  while (i--)
    resArray[i] = [ownProps[i], obj[ownProps[i]]];

  return resArray;
};

if (!Object.entries) {
  Object.entries = entries;
}
