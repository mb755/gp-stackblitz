import * as math from 'mathjs';

function rbfKernel(x1: number, x2: number, lengthScale: number, varianceScale: number): number {
  const diff = x1 - x2;
  return varianceScale * Math.exp(-(diff * diff) / (2 * lengthScale * lengthScale));
}

export function calculateGaussianProcess(
  observations: [number, number, number][],
  lengthScale: number,
  varianceScale: number,
  numSamples: number,
  observationStdDev: number
): { meanLine: [number, number][]; upperBound: [number, number][]; lowerBound: [number, number][]; samples: [number, number][][] } {
  const xTest = Array.from({ length: 100 }, (_, i) => i * 0.1 - 5);

  if (observations.length === 0) {
    // Return default values when there are no observations
    const defaultY = 0;
    return {
      meanLine: xTest.map(x => [x, defaultY]),
      upperBound: xTest.map(x => [x, defaultY + 2 * Math.sqrt(varianceScale)]),
      lowerBound: xTest.map(x => [x, defaultY - 2 * Math.sqrt(varianceScale)]),
      samples: Array(numSamples).fill(null).map(() => 
        xTest.map(x => [x, defaultY + math.random(0, Math.sqrt(varianceScale))])
      )
    };
  }

  const xValues = observations.map((obs) => obs[0]);
  const yValues = observations.map((obs) => obs[1]);

  const K = xValues.map((xi, i) =>
    xValues.map((xj, j) => rbfKernel(xi, xj, lengthScale, varianceScale) + (i === j ? observationStdDev * observationStdDev : 0))
  );
  const Kstar = xTest.map((x) =>
    xValues.map((xi) => rbfKernel(x, xi, lengthScale, varianceScale))
  );
  const KstarStar = xTest.map((xi) =>
    xTest.map((xj) => rbfKernel(xi, xj, lengthScale, varianceScale))
  );

  const KInv = math.inv(K);
  const mean = math.multiply(math.multiply(Kstar, KInv), yValues) as number[];
  const cov = math.subtract(KstarStar, math.multiply(math.multiply(Kstar, KInv), math.transpose(Kstar))) as number[][];

  const stdDev = cov.map((row: number[]) => Math.sqrt(Math.max(row[row.length - 1], 0)));

  const meanLine: [number, number][] = xTest.map((x, i) => [x, mean[i]]);
  const upperBound: [number, number][] = xTest.map((x, i) => [x, mean[i] + 1.96 * stdDev[i]]);
  const lowerBound: [number, number][] = xTest.map((x, i) => [x, mean[i] - 1.96 * stdDev[i]]);

  // Generate samples using Cholesky decomposition
  const L = math.cholesky(math.matrix(cov));
  const samples: [number, number][][] = Array(numSamples).fill(null).map(() => {
    const z = math.matrix(xTest.map(() => math.random(-1, 1)));
    const sample = math.add(mean, math.multiply(L, z)) as number[];
    return xTest.map((x, i) => [x, sample[i]]);
  });

  return { meanLine, upperBound, lowerBound, samples };
}