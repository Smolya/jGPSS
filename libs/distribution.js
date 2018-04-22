const DUniform = (min, max) => Math.floor(Math.random() * (max - min)) + min;
const Exponential = (average = 1, shift = 0) => (-Math.log(Math.random()) * (average - shift) + shift);
const Uniform = (min, max) => Math.random() * (max - min) + min;

module.exports = {
    DUniform,
    Exponential,
    Uniform,
};