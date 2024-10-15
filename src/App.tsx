import React, { useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { Slider, Typography, Box, Paper } from '@mui/material';
import { calculateGaussianProcess } from './gaussianProcess';

const App: React.FC = () => {
  const [observations, setObservations] = useState<[number, number, number][]>([]);
  const [lengthScale, setLengthScale] = useState<number>(1);
  const [varianceScale, setVarianceScale] = useState<number>(1);
  const [numSamples, setNumSamples] = useState<number>(5);
  const [observationStdDev, setObservationStdDev] = useState<number>(0.1);

  const handlePlotClick = useCallback((event: Plotly.PlotMouseEvent) => {
    const point = event.points[0];
    if (point && 'x' in point && 'y' in point) {
      const newPoint: [number, number, number] = [point.x as number, point.y as number, observationStdDev];
      setObservations((prev) => [...prev, newPoint]);
    }
  }, [observationStdDev]);

  const handleRightClick = useCallback((event: Plotly.PlotMouseEvent) => {
    event.preventDefault();
    const point = event.points[0];
    if (point && 'x' in point && 'y' in point) {
      const clickedPoint: [number, number] = [point.x as number, point.y as number];
      setObservations((prev) =>
        prev.filter(
          (p) =>
            Math.abs(p[0] - clickedPoint[0]) > 0.1 ||
            Math.abs(p[1] - clickedPoint[1]) > 0.1
        )
      );
    }
  }, []);

  const { meanLine, upperBound, lowerBound, samples } = calculateGaussianProcess(
    observations,
    lengthScale,
    varianceScale,
    numSamples,
    observationStdDev
  );

  const plotData = [
    {
      x: meanLine.map((p) => p[0]),
      y: meanLine.map((p) => p[1]),
      type: 'scatter',
      mode: 'lines',
      name: 'Mean',
      line: { color: 'blue', width: 2 },
    },
    {
      x: upperBound.map((p) => p[0]),
      y: upperBound.map((p) => p[1]),
      type: 'scatter',
      mode: 'lines',
      name: '95% Confidence Interval',
      line: { color: 'rgba(0,0,255,0.2)' },
      showlegend: false,
    },
    {
      x: lowerBound.map((p) => p[0]),
      y: lowerBound.map((p) => p[1]),
      type: 'scatter',
      mode: 'lines',
      fill: 'tonexty',
      fillcolor: 'rgba(0,0,255,0.1)',
      line: { color: 'rgba(0,0,255,0.2)' },
      showlegend: true,
    },
    {
      x: observations.map((p) => p[0]),
      y: observations.map((p) => p[1]),
      type: 'scatter',
      mode: 'markers',
      name: 'Observations',
      marker: { color: 'red', size: 8 },
      error_y: {
        type: 'data',
        array: observations.map((p) => p[2]),
        visible: true,
      },
    },
    ...samples.map((sample, index) => ({
      x: sample.map((p) => p[0]),
      y: sample.map((p) => p[1]),
      type: 'scatter',
      mode: 'lines',
      name: `Sample ${index + 1}`,
      line: { color: `rgba(0,128,0,${0.5 / numSamples})` },
      showlegend: false,
    })),
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        Interactive Gaussian Process Plot
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Plot
          data={plotData}
          layout={{
            width: 700,
            height: 450,
            title: 'Gaussian Process',
            xaxis: { title: 'X', range: [-5, 5] },
            yaxis: { title: 'Y', range: [-3, 3] },
            margin: { l: 50, r: 50, b: 50, t: 50 },
            legend: { orientation: 'h', y: -0.2 },
          }}
          onClick={handlePlotClick}
          onRightClick={handleRightClick}
          config={{ displayModeBar: false }}
        />
      </Paper>
      <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto' }}>
        <Typography gutterBottom>Length Scale: {lengthScale.toFixed(2)}</Typography>
        <Slider
          value={lengthScale}
          onChange={(_, value) => setLengthScale(value as number)}
          min={0.1}
          max={5}
          step={0.1}
        />
        <Typography gutterBottom>Variance Scale: {varianceScale.toFixed(2)}</Typography>
        <Slider
          value={varianceScale}
          onChange={(_, value) => setVarianceScale(value as number)}
          min={0.1}
          max={5}
          step={0.1}
        />
        <Typography gutterBottom>Number of Samples: {numSamples}</Typography>
        <Slider
          value={numSamples}
          onChange={(_, value) => setNumSamples(value as number)}
          min={1}
          max={20}
          step={1}
        />
        <Typography gutterBottom>Observation Std Dev: {observationStdDev.toFixed(2)}</Typography>
        <Slider
          value={observationStdDev}
          onChange={(_, value) => setObservationStdDev(value as number)}
          min={0.01}
          max={1}
          step={0.01}
        />
      </Box>
    </Box>
  );
};

export default App;