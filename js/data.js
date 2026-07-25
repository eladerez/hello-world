/*
 * Content for the ML Q&A site.
 *
 * QUESTIONS: each item is { id, question, answer }.
 * GLOSSARY: keyed by a slug (lowercase, non-alphanumeric -> "-").
 * each entry is { term, short, explanation }.
 *
 * Inside "question", "answer", and "explanation" strings, wrap any
 * word or phrase you want to be hoverable/clickable in double
 * brackets:
 *
 *   "...trained with [[gradient descent]]..."
 *
 * That looks up GLOSSARY["gradient-descent"]. If the display text
 * shouldn't match the glossary key exactly, use a pipe:
 *
 *   "...trained with [[gradient-descent|gradient descent]]..."
 *
 * Explanation text can itself contain [[...]] links, so readers can
 * drill down through related terms.
 */

const QUESTIONS = [
  {
    id: "q-gradient-descent",
    question: "How does [[gradient descent]] actually train a [[neural-network|neural network]]?",
    answer:
      "Gradient descent repeatedly nudges the network's [[parameters]] in the direction that most reduces the [[loss-function|loss function]]. " +
      "At each step it computes the gradient (the slope of the loss with respect to every parameter, found via [[backpropagation]]), " +
      "then takes a small step opposite that gradient, scaled by the [[learning-rate|learning rate]]. Repeated over many steps, " +
      "this walks the parameters toward a set of values that make the model's predictions match the training data well, " +
      "while trying to avoid [[overfitting]] along the way.",
  },
  {
    id: "q-overfitting",
    question: "What is [[overfitting]] and how do people try to prevent it?",
    answer:
      "Overfitting is when a model learns the noise and quirks of its training data instead of the underlying pattern, so it performs " +
      "well on training data but poorly on new data. Common defenses include [[regularization]], gathering more training data, " +
      "using a simpler model, early stopping, and holding out a validation set to catch it before it happens.",
  },
];

const GLOSSARY = {
  "gradient-descent": {
    term: "Gradient Descent",
    short: "An iterative algorithm that adjusts parameters step by step to reduce a model's error.",
    explanation:
      "Gradient descent is an optimization algorithm. Imagine the [[loss-function|loss function]] as a landscape of hills and valleys, " +
      "where height represents how wrong the model currently is. Gradient descent looks at the slope under its feet (the gradient) and " +
      "takes a step downhill. Do that enough times, with a well-chosen [[learning-rate|learning rate]], and the model settles into a " +
      "valley — a set of [[parameters]] that make its predictions reasonably accurate.",
  },
  "neural-network": {
    term: "Neural Network",
    short: "A model made of layers of simple connected units that jointly learn to approximate a function.",
    explanation:
      "A neural network is a model built from layers of interconnected nodes ('neurons'). Each connection has a weight, and each node " +
      "applies a simple transformation to its inputs. On their own the pieces are simple, but stacked in layers and trained with " +
      "[[gradient-descent|gradient descent]], the network can approximate very complex functions — from recognizing images to generating text.",
  },
  parameters: {
    term: "Parameters",
    short: "The internal numbers (weights and biases) a model adjusts while learning.",
    explanation:
      "Parameters are the numbers inside a model — mainly weights and biases — that get adjusted during training. A model 'learning' " +
      "really just means an algorithm like [[gradient-descent|gradient descent]] is searching for parameter values that minimize the " +
      "[[loss-function|loss function]] on the training data.",
  },
  "loss-function": {
    term: "Loss Function",
    short: "A single number measuring how wrong a model's predictions currently are.",
    explanation:
      "A loss function turns 'how wrong is the model right now' into a single number, by comparing predictions to the true answers. " +
      "Training is the process of searching for [[parameters]] that make this number as small as possible, typically using " +
      "[[gradient-descent|gradient descent]]. A model that minimizes loss too aggressively on its training data risks [[overfitting]].",
  },
  backpropagation: {
    term: "Backpropagation",
    short: "The algorithm that efficiently computes how much each parameter contributed to the error.",
    explanation:
      "Backpropagation is the method used to compute gradients in a [[neural-network|neural network]]. It works backward from the " +
      "[[loss-function|loss function]] through each layer, using the chain rule from calculus to figure out how much each individual " +
      "[[parameters|parameter]] contributed to the error. Those gradients are what [[gradient-descent|gradient descent]] then uses to " +
      "update the parameters.",
  },
  "learning-rate": {
    term: "Learning Rate",
    short: "A number controlling how big a step is taken at each round of training.",
    explanation:
      "The learning rate scales how far [[gradient-descent|gradient descent]] moves the [[parameters]] at each step. Too high, and " +
      "training can overshoot and become unstable; too low, and training crawls and may take forever (or get stuck) before reaching " +
      "good values.",
  },
  overfitting: {
    term: "Overfitting",
    short: "When a model memorizes training data instead of learning general patterns.",
    explanation:
      "Overfitting happens when a model fits the training data so closely that it captures noise and coincidences rather than the true " +
      "underlying pattern. It shows up as great performance on training data but poor performance on new, unseen data. " +
      "[[regularization]] and validation sets are common ways to catch and limit it.",
  },
  regularization: {
    term: "Regularization",
    short: "Techniques that discourage a model from becoming overly complex, to fight overfitting.",
    explanation:
      "Regularization covers a family of techniques that discourage a model from becoming unnecessarily complex, which helps prevent " +
      "[[overfitting]]. Examples include penalizing large [[parameters]] in the [[loss-function|loss function]] (L1/L2 regularization), " +
      "dropout, and early stopping.",
  },
};
