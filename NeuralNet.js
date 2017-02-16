/**
 * Extremely simple feedforward neural network.
 * Training via stochastic gradient descent / error backpropagation.
 * Not very fast, but easy to understand.
 * (c) L. Diener 2015
 */
 
 /**
  * Helpers
  */
var weightInitRange = 1.0;
var biasInitRange = 1.0;

// LFSR RNG because seeds are not a thing in JS (?)
var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;

// Takes any integer
function seed(i) {
    m_w = i;
}

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
}

// Hopefully sane array shuffle lifted straight from stackoverflow 
function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Number uniformly at random from [-x, x]
var centeredRandom = function(x) { 
  return (random() - 0.5) * 2.0 * x; 
};

/**
 * Activation functions for feedforward layers
 */
// Rectified linear units have a simple derivative and thus are \nice/
var rectifiedLinear = function(x) {
  return Math.max(0, x);
};
var rectifiedLinearD = function(x) {
  return x < 0 ? 0 : 1;
};

// Same for logistic sigmoids
var sigmoid = function(x) {
  return 1.0 / (1.0 + Math.exp(-x));
};
var sigmoidD = function(x) {
  return sigmoid(x) * (1.0 - sigmoid(x));
};

// Identity activation for pure regression layers
// Use in the final layer, probably
var identity = function(x) {
  return x;
};
var identityD = function(x) {
  return 1;
};

/**
 * Loss functions
 */
// Square error because simplicity
var squareErrorVec = function(outputVec, referenceVec) {
  error = [];
  
  for (var i = 0; i < outputVec.length; i += 1) {
    error[i] = 0.5 * Math.pow((outputVec[i] - referenceVec[i]), 2.0);
  }
  
  return error;
};
var squareErrorVecD = function(outputVec, referenceVec) {
  errorD = [];
  
  for (var i = 0; i < outputVec.length; i += 1) {
    errorD[i] = outputVec[i] - referenceVec[i];
  }
  
  return errorD;
};

/**
 * Simple feedforward neuron with bias
 */
// Create a single neuron
var Neuron = function(numInputs, actFunc, actFuncD) {
  var weightVec = [];
  
  for (var i = 0; i < numInputs; i += 1) {
    weightVec[i] = centeredRandom(weightInitRange);
  }
  
  // Parameters
  this.bias = centeredRandom(biasInitRange);
  this.weightVec = weightVec;
  
  // For backpropagation
  this.currentActivation = 0;
  this.currentOutput = 0;
  this.currentOutputErrorD = 0;
  
  // For batched updates (Minibatch SGD)
  this.outputAccu = 0;
  this.errorDAccu = 0;
  
  // Neuron activation
  this.actFunc = actFunc;
  this.actFuncD = actFuncD;
};

// Calculate neurons output given a set of inputs
Neuron.prototype.calculateOutput = function(inputVec) {
  activation = this.bias;
  
  for (var i = 0; i < inputVec.length; i += 1) {
    activation += this.weightVec[i] * inputVec[i];
  }
  this.currentActivation = activation; 
  this.currentOutput = this.actFunc(activation);

  
  return this.currentOutput;
};

// Calculate neurons edges error derivative contributions
// Assumes that for this neuron, the error value is already set.
Neuron.prototype.calculateErrorD = function() {
  errorVecD = [];
  
  for (var i = 0; i < this.weightVec.length; i += 1) {
    errorVecD[i] = this.weightVec[i] * this.currentOutputErrorD;
  }
  
  return errorVecD;
};

// Resets training accumulators
Neuron.prototype.resetTrainingAccus = function() {
  this.outputAccu = 0;
  this.errorDAccu = 0;
};

// Accumulates output and error derivative after backpropagation
Neuron.prototype.accumulateForTraining = function() {
  // console.log("Accumulating output " + this.currentOutput + " and errorD " + this.currentOutputErrorD);
  this.outputAccu = this.outputAccu + this.currentOutput;
  this.errorDAccu = this.errorDAccu + this.currentOutputErrorD;
};

// Updates this neurons weights and bias after minibatch is finished
Neuron.prototype.updateParameters = function(trainingMomentum, trainingRate, minibatchSize) {
  meanOutput = this.outputAccu / minibatchSize;
  meanErrorD = this.errorDAccu / minibatchSize;
  // console.log("Weight update with mean " + meanOutput + "and errorD " + meanErrorD);
  for (var i = 0; i < this.weightVec.length; i += 1) {
    newWeight = this.weightVec[i] - (meanErrorD * meanOutput) * trainingRate;
    this.weightVec[i] = newWeight * trainingMomentum + this.weightVec[i] * (1.0 - trainingMomentum);
  }
  newBias = this.bias - meanErrorD * trainingRate;
  this.bias = newBias * trainingMomentum + this.bias * (1.0 - trainingMomentum);
};

/**
 * Simple feedforward layer with bias
 */
// Create a single feed-forward layer
var NeuralNetworkLayer = function(numInputs, numNeurons, actFunc, actFuncD) {
  var neurons = [];
  
  for (var i = 0; i < numNeurons; i += 1) {
    neurons[i] = new Neuron(numInputs, actFunc, actFuncD);
  }
  
  this.neurons = neurons;
};

// Calculate layer outputs (i.e. just iterate over all the neurons in the layer)
NeuralNetworkLayer.prototype.calculateOutput = function (inputVec) {
  outputVec = [];

  for (var i = 0; i < this.neurons.length; i += 1) {
    outputVec[i] = this.neurons[i].calculateOutput(inputVec);
  }
  
  return outputVec;
};

// Calculates every neurons error contributions for the layer above
// Assumes that for this layer, the error values are already set.
NeuralNetworkLayer.prototype.backPropagateError = function () {
  errorVecD = [];

  for (var i = 0; i < this.neurons[0].weightVec.length; i += 1) {
    errorVecD[i] = 0;
  }

  for (var j = 0; j < this.neurons.length; j += 1) {
    errorVecNeuronD = this.neurons[j].calculateErrorD();
    for (i = 0; i < this.neurons[0].weightVec.length; i += 1) {
      errorVecD[i] += errorVecNeuronD[i];
    }
  }

  return errorVecD;
};

// Resets all neurons training accumulators
NeuralNetworkLayer.prototype.resetTrainingAccus = function () {
  for (var j = 0; j < this.neurons.length; j += 1) {
    this.neurons[j].resetTrainingAccus();
  }
};

// Accumulates evreything needed for training in all neurons after backpropagation
NeuralNetworkLayer.prototype.accumulateForTraining = function () {
  for (var j = 0; j < this.neurons.length; j += 1) {
    this.neurons[j].accumulateForTraining();
  }
};

// Updates all neurons weights and biases after minibatch is finished
NeuralNetworkLayer.prototype.updateParameters = function (trainingMomentum, trainingRate, minibatchSize) {
  for (var j = 0; j < this.neurons.length; j += 1) {
    this.neurons[j].updateParameters(trainingMomentum, trainingRate, minibatchSize);
  }
};

/**
 * Softmax layer. Parameterless.
 */
// Create a single Softmax layer
var SoftmaxLayer = function(numInputs, numNeurons) { };

// Calculate layer outputs
SoftmaxLayer.prototype.calculateOutput = function (inputVec) {
  outputVec = [];

  for (var i = 0; i < this.neurons.length; i += 1) {
    // TODO
  }
  
  return outputVec;
};

// Calculates every neurons error contributions for the layer above
// Assumes that for this layer, the error values are already set.
SoftmaxLayer.prototype.backPropagateError = function () {
  errorVecD = [];

  for (var i = 0; i < this.neurons[0].weightVec.length; i += 1) {
    errorVecD[i] = 0;
  }

  for (var j = 0; j < this.neurons.length; j += 1) {
    // TODO
  }

  return errorVecD;
};

// Parameterless -> no-op
SoftmaxLayer.prototype.resetTrainingAccus = function () { };

// Parameterless -> no-op
SoftmaxLayer.prototype.accumulateForTraining = function () { };

// Parameterless -> no-op
SoftmaxLayer.prototype.updateParameters = function (trainingMomentum, trainingRate, minibatchSize) { };


/**
 * A neural network
 */
// A feedforward network, as a collection of layers
NeuralNetwork = function() {
  this.layers = [];
};

// Plop an additional layer into the network
NeuralNetwork.prototype.addLayer = function(layer) {
  this.layers[this.layers.length] = layer;
};

// Calculate network output by propagating values through all layers
NeuralNetwork.prototype.calculateOutput = function(inputVec) {
  outputVec = inputVec;
  
  for (var i = 0; i < this.layers.length; i += 1) {
    outputVec = this.layers[i].calculateOutput(outputVec);
  }
 
  return outputVec;
};

// Calculate mean error given a set of in- and output vectors
NeuralNetwork.prototype.calculateMeanError = function(vectorSet) {
  totalError = 0;
  
  for (var i = 0; i < vectorSet.length; i += 1) {
    inputVec = vectorSet[i][0];
    referenceVec = vectorSet[i][1];
    outputVec = this.calculateOutput(inputVec);
    errorVec = squareErrorVec(outputVec, referenceVec);
    for (var j = 0; j < errorVec.length; j += 1) {
      totalError += errorVec[j];
    }
  }
  
  return totalError / vectorSet.length;
};

// Perform batched weight / bias update, then calculate and return square error.
NeuralNetwork.prototype.doTrainingMinibatch = function(trainingSet, trainingMomentum, trainingRate) {
  // Accumulate values for parameter update
  for (j = 0; j < this.layers.length; j += 1) {
    this.layers[j].resetTrainingAccus();
  }
  
  // For every example in the mini-batch
  for (var i = 0; i < trainingSet.length; i += 1) {
    inputVec = trainingSet[i][0];
    referenceVec = trainingSet[i][1];   
    outputVec = this.calculateOutput(inputVec);
    errorVecD = squareErrorVecD(outputVec, referenceVec);
    
    // Set output error
    for (j = 0; j < errorVecD.length; j += 1) {
      this.layers[this.layers.length - 1].neurons[j].currentOutputErrorD = 
         errorVecD[j] * this.layers[this.layers.length - 1].neurons[j].actFuncD(
            this.layers[this.layers.length - 1].neurons[j].currentActivation);
    }
  
    // Now, propagate the error upwards
    for (j = this.layers.length - 1; j > 0; j -= 1) {
      // Get back-propagated error for the layer below the current one
      errorVecD =  this.layers[j].backPropagateError();
      
      // And again, set error for the next layer
      for (k = 0; k < errorVecD.length; k += 1) {
        this.layers[j - 1].neurons[k].currentOutputErrorD = 
          errorVecD[k] * this.layers[j - 1].neurons[k].actFuncD(
            this.layers[j - 1].neurons[k].currentActivation);
      }
    }
    
    // Accumulate values for parameter update
    for (j = 0; j < this.layers.length; j += 1) {
      this.layers[j].accumulateForTraining();
    }
  }
  
  // Batch is done, so finally update weight and bias values
  for (j = 0; j < this.layers.length; j += 1) {
    this.layers[j].updateParameters(trainingMomentum, trainingRate, trainingSet.length);
  }
  
  return this.calculateMeanError(trainingSet);
};

// Perform one iteration of minibatched SGD training.
// If training set size is not evenly divisible by minibatch size, last minibatch is incomplete.
NeuralNetwork.prototype.doTrainingEpoch = function(trainingSet, trainingMomentum, trainingRate, minibatchSize) {
  // Shuffle training set
  trainingSetShuffeled = shuffleArray(trainingSet);

  // Extract minibatches and train
  summedSquareError = 0;
  currentMinibatchPosition = 0;
  minibatchCount = 0;
  while(currentMinibatchPosition + minibatchSize <= trainingSetShuffeled.length) {
    minibatch = trainingSetShuffeled.slice(currentMinibatchPosition, currentMinibatchPosition + minibatchSize);
    summedSquareError += this.doTrainingMinibatch(minibatch, trainingMomentum, trainingRate);
    minibatchCount += 1;
    currentMinibatchPosition += minibatchSize;
  }
  
  // Handle final minibatch
  if(currentMinibatchPosition != trainingSetShuffeled.length) {
    minibatch = trainingSetShuffeled.slice(currentMinibatchPosition);
    summedSquareError += this.doTrainingMinibatch(minibatch, trainingMomentum, trainingRate);
    minibatchCount += 1;
  }
  
  return summedSquareError / minibatchCount;
};

// Output weights and bias for every neuron in the network
NeuralNetwork.prototype.showNetwork = function() {
  for (j = 0; j < this.layers.length; j += 1) {
     for (i = 0; i < this.layers[j].neurons.length; i += 1) {
       console.log("Layer " + j + " neuron " + i + 
                   ": Weights [" + this.layers[j].neurons[i].weightVec + 
                   "], Bias " + this.layers[j].neurons[i].bias);
     }
  }
};

/**
 * Data mangling
 */
// Column-wise mean calculation
function findColumnMeans(inputArrays) {
  columnMeans = [];
  for (i = 0; i< inputArrays[0].length; i += 1) {
    columnMeans[i] = 0;
  }
  
  for (j = 0; j < inputArrays.length; j += 1) {
    for (i = 0; i < inputArrays[j].length; i += 1) {
      columnMeans[i] += inputArrays[j][i];
    }
  }
  
  for (i = 0; i < inputArrays[0].length; i += 1) {
    columnMeans[i] /= inputArrays.length;
  }
  
  return columnMeans;
}

// Normalize data to zero mean
function makeZeroMean(inputArrays, columnMeans) {
  for (j = 0; j < inputArrays.length; j += 1) {
    for (i = 0; i < inputArrays[j].length; i += 1) {
      inputArrays[j][i] -= columnMeans[i];
    }
  }
  
  return inputArrays;
}

// Find standard deviation of zero mean values
function findColumnStdDevZeroMean(inputArrays) {
  columnStd = [];
  for (i = 0; i< inputArrays[0].length; i += 1) {
    columnStd[i] = 0;
  }
  
  for (j = 0; j < inputArrays.length; j += 1) {
    for (i = 0; i < inputArrays[j].length; i += 1) {
      columnStd[i] += Math.pow(inputArrays[j][i], 2.0);
    }
  }
  
  for (i = 0; i < inputArrays[0].length; i += 1) {
    columnStd[i] /= inputArrays.length;
    columnStd[i] = Math.sqrt(columnStd[i]);
  }
  
  return columnStd;
}

// Make data that is already zero mean, unit variance
function makeUnitVariance(inputArrays, columnStd) {
  for (j = 0; j < inputArrays.length; j += 1) {
    for (i = 0; i < inputArrays[j].length; i += 1) {
      inputArrays[j][i] /= columnStd[i];
    }
  }
  
  return inputArrays;
}

/**
 * Training boilerplate helpers
 */
// 2 hidden layer 2x dilated network
function makeSimpleNetwork(dimensionsIn, dimensionsOut) {
  neuralNetwork = new NeuralNetwork();
  neuralNetwork.addLayer(new NeuralNetworkLayer(dimensionsIn, dimensionsIn * 2, sigmoid, sigmoidD));
  neuralNetwork.addLayer(new NeuralNetworkLayer(dimensionsIn * 2, dimensionsOut * 2, sigmoid, sigmoidD));
  neuralNetwork.addLayer(new NeuralNetworkLayer(dimensionsOut * 2, dimensionsOut, identity, identityD)); // TODO stop being lazy, write a softmax layer + CE loss
  return neuralNetwork;
}

// Makes data zero mean unit std, trains with different initializations
function trainSimpleNetwork(trainingSetIn, trainingSetOut, maxEpochs, learnRate, maxAttempts) {
  // Find means for normalization
  inputMeans = findColumnMeans(trainingSetIn);
  outputMeans = findColumnMeans(trainingSetOut);

  // Normalize means
  trainingSetIn = makeZeroMean(trainingSetIn, inputMeans);
  trainingSetOut = makeZeroMean(trainingSetOut, outputMeans);

  // Find standard deviation for normalization
  inputStd = findColumnStdDevZeroMean(trainingSetIn);
  outputStd = findColumnStdDevZeroMean(trainingSetOut);

  // Normalize variance
  trainingSetIn = makeUnitVariance(trainingSetIn, inputStd);
  trainingSetOut = makeUnitVariance(trainingSetOut, outputStd);

  // Put together
  trainingSet = [];
  for(var i = 0; i < trainingSetIn.length; i += 1) {
    trainingSet[i] = [trainingSetIn[i], trainingSetOut[i]];
  }

  // Steal some of the training data to be eval data
  evalSet = trainingSet.slice(trainingSet.length - 4); // TODO sanity
  trainingSet = trainingSet.slice(0, trainingSet.length - 4); // same

  var bestLoss = 300000000.0;
  var bestNet = null;
  for(var attempt = 0; attempt < maxAttempts; attempt += 1) {
    seed(attempt * 12341);
    seed(random());
  
    // Create a simple network
    neuralNetwork = makeSimpleNetwork(trainingSetIn[0].length, trainingSetOut[0].length);

    // Run training
    console.log("Training begins.");
    trainSetError = 3.0;
    for(var epoch = 0; epoch < maxEpochs; epoch += 1) {
      trainSetError = neuralNetwork.doTrainingEpoch(trainingSet, 0.9, learnRate, 1000);
      console.log("Training loss in epoch " + epoch + ": " + trainSetError);
    }
	
    // Evaluate
    console.log("Evaluation begins.");
    for (j = 0; j < this.evalSet.length; j += 1) {
      evalInput = this.evalSet[j][0];
      evalReference = this.evalSet[j][1];
      evalOutput = neuralNetwork.calculateOutput(evalInput);
    }
  
    if(trainSetError < bestLoss) {
  	  bestLoss = trainSetError;
      bestNet = neuralNetwork;
    }
  }
  
  return [bestNet, bestLoss];
}
