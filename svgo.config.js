module.exports = {
  multipass: true,
  js2svg: { pretty: true, indent: 2 },
  plugins: [
    'preset-default',
    {
      name: 'removeViewBox',
      active: false
    },
    'removeDimensions'
  ]
};
