const predef = require("./tools/predef");
const meta = require("./tools/meta");
const SMA = require("./tools/SMA");
const EMA = require('./tools/EMA');
const WMA = require('./tools/WMA');
const MMA = require('./tools/MMA');
const p = require("./tools/plotting");
function HullMovingAverage(period) {
function hma(value) {
return hma.push(value);
}
hma.reset = () => {
hma.state = {
wmaLong: WMA(period),
wmaShort: WMA(period / 2),
wmaSqrt: WMA(Math.sqrt(period)),
avg: 0
};
};
hma.push = (value) => {
const wmaLong = hma.state.wmaLong(value);
const wmaShort = hma.state.wmaShort(value) * 2;
const wmaDiff = wmaShort - wmaLong;
const wmaSqrt = hma.state.wmaSqrt(wmaDiff);
return wmaSqrt;
}
hma.avg = () => hma.state.wmaSqrt.avg();
hma.reset();
return hma;
}
function getMovingAverage(averageType, period) {
let ma;
switch (averageType) {
case "hma":
ma = HullMovingAverage(period);
break;
case "sma":
ma = SMA(period);
break;
case "wma":
ma = WMA(period);
break;
case "mma":
ma = MMA(period);
break;
default:
ma = EMA(period);
}
return ma;
}
class macdMultiColoredHistogram {
init() {
this.signalEMA = getMovingAverage(this.props.averageType, this.props.signal);
this.fastEMA = getMovingAverage(this.props.averageType, this.props.fast);
this.slowEMA = getMovingAverage(this.props.averageType, this.props.slow);
}
map(entity, index, inputSeries) {
let difference;
let macd;
let signal;
if (index >= this.props.slow - 1) {
const value = entity.value();
macd = this.fastEMA(value) - this.slowEMA(value);
signal = this.signalEMA(macd);
difference = macd - signal;
}
return {
macd,
signal,
difference,
zero: 0,
};
}
filter(d) {
return predef.filters.isNumber(d.macd);
}
}
function histogramPlotter(canvas, indicatorInstance, history) {
if (!indicatorInstance.props.showHistogram) {
return;
}
for (let i = 0; i < history.data.length; ++i) {
const item = history.get(i);
const x = p.x.get(item);
const y = p.offset(0, item.difference);
const zero = p.offset(0, 0);
const color = item.difference > 0 ? indicatorInstance.props.posRisingColor :
indicatorInstance.props.negFallingColor;
const height = Math.abs(zero - y);
canvas.drawBar(
x - 0.35, // left
y > zero ? zero : y, // top
0.7, // width
height, // height
{
color: color,
opacity: 0.75,
}
);
}
}
module.exports = {
name: "MACD",
description: "YAZDANI - MACD",
calculator: macdMultiColoredHistogram,
areaChoice: meta.AreaChoice.NEW,
tags: ["Otto.Blink"],
params: {
fast: predef.paramSpecs.period(12),
slow: predef.paramSpecs.period(26),
signal: predef.paramSpecs.period(9),
averageType: predef.paramSpecs.enum({
sma: 'Simple',
ema: 'Exponential',
wma: 'Weighted',
//mma: 'Modified',
hma: 'Hull',
}, 'ema'),
dividerForHistogram: predef.paramSpecs.enum({
spacer: '------------------------------------------------------------------------------------------------------------------------------------------------------'
}, 'spacer'),
showHistogram: predef.paramSpecs.bool(true),
posRisingColor: predef.paramSpecs.color("#1BAD8D"),
posFallingColor: predef.paramSpecs.color("#9BEBD8"),
negRisingColor: predef.paramSpecs.color("#EE939E"),
negFallingColor: predef.paramSpecs.color("#E01515"),
},
validate(obj) {
if (obj.slow < obj.fast) {
return meta.error("slow", "Slow period should be larger than fast period");
}
},
inputType: meta.InputType.ANY,
plotter: [
{ type: 'multiline', field: ['macd', 'signal', 'zero'] },
predef.plotters.custom(histogramPlotter),
],
plots: {
macd: { title: "MACD" },
signal: { title: "Signal" },
zero: { title: "Zero", displayOnly: true }
},
schemeStyles: {
dark: {
zero: predef.styles.plot({ color: "white", lineStyle: 1, lineWidth: 1, opacity: 100 }),
macd: predef.styles.plot("#3180DD"),
signal: predef.styles.plot("#eee140"),
}
},
};