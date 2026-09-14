const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// v5: no `input` option — global.css is picked up from the entry import (app/_layout.tsx)
module.exports = withNativeWind(config);
