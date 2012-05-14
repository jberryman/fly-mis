I've finished a simulation-visualization of the very cool algorithm for
generating a 
[Maximal Independant Set](http://en.wikipedia.org/wiki/Maximal_independent_set) 
from "A Biological Solution to a Fundamental Distributed Computing Problem" by
Afek et al. (sorry I don't have a link to the PDF, and respect you too much to
link you to a paywall).

You can [play with it](http://jberryman.github.com/fly-mis/)
or [check out the code](https://github.com/jberryman/fly-mis) on GitHub; 
in particular, see 
["algorithm.js"](https://github.com/jberryman/fly-mis/blob/master/algorithm.js)
for the didactic implementation of the algorithm.

It uses jQuery and [Raphael.js](http://raphaeljs.com) for the visuals and
events.

## Goals for the project

1. create a fun visual simulation that can give a nice intuition for the
  algorithm

2. remain true to the algorithm as described in the paper, and to avoid anything
  novel or clever at this point

3. attempt to organize my code in such a way as to be a readable explanation of
  the algorithm as described in the paper, hiding or isolating implementation
  details

4. attempt to model the behavior of a real-world network of nodes using the OO
  abstraction, and (synchronous) events.

Trying to meet these demands was revealing. For one thing I was forced to break
up the two message exchange steps into four discrete steps which must be
performed synchronously across the network for things to work without race
conditions.

## Later

The pseudocode description is hiding some of the complexity and brittleness of
the algorithm IMHO. I'd like to take it apart and try to rip out as many of the
synchronous-network dependencies as I can, or explore how an identical but
asynchronous system behaves: give all the nodes jittery clocks and without a
coordinated start.
