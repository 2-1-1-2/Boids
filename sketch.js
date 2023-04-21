let flock;
let words;
let myFont;
let splitWords;
let time = -10;
let max_delta = 0;
let coeff_t = 2.5;
let colors = ['#FFC107', '#FF9800', '#FF5722'];
let colors_b = ['#3e1609', '#000000'];


function preload() {
  words = loadStrings('words.txt');

  myFont = loadFont('Heavitas.ttf');
}


function setup() {
  createCanvas(720, 576);

  splitWords = split(words[0], ',');
  flock = new Flock();
  for (let i = 0; i < 91; i++) {
    pos = i < (91 / 4) ? 2 : i < (91 / 2) ? 4 : i < (91 * 3 / 4) ? 1.5 : 1;
    let b = new Boid(width / pos, height / pos, i);
    flock.addBoid(b);
  }

}
function resetAnimation() {

  max_delta = 0;
  splitWords = split(words[0], ',');
  flock = new Flock();
  let pos;

  time = -6000;
  // Add an initial set of boids into the system
  for (let i = 0; i < 91; i++) {

    time = -6000;
    pos = i < (91 / 4) ? 2 : i < (91 / 2) ? 4 : i < (91 * 3 / 4) ? 1.5 : 1;
    let b = new Boid(width / pos, height / pos, i);
    flock.addBoid(b);
  }
  time = -6000;

}

function draw() {
  background("#1f1613");

  flock.run();
}

// Add a new boid into the System
function mouseDragged() {
  flock.addBoid(new Boid(mouseX, mouseY));
}


// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids


function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function () {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function (b) {
  this.boids.push(b);
}


function Boid(x, y, i = 0) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 5.0;
  this.maxspeed = 1;    // Maximum speed
  this.maxforce = 0.008; // Maximum steering force
  // !HERE!
  let time = pos = i < (91 / 4) ? 2 : i < (91 / 2) ? 1 : i < (91 * 3 / 4) ? 1 : 0.5;
  this.color = Math.floor(time);
  this.word = splitWords.splice((int)(Math.random() * splitWords.length), 1);
  this.apparition = Math.floor(Math.random() * (400000 * time - 200000 * time + 1) + 300000 * time);
  max_delta = this.apparition * (coeff_t + 0.1) > max_delta ? this.apparition * (coeff_t + 0.1) : max_delta;

}

Boid.prototype.run = function (boids) {
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
}

Boid.prototype.applyForce = function (force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(1.5);
  ali.mult(1.0);
  coh.mult(1.0);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function () {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
  let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function () {
  // !HERE!
  push();
  textFont(myFont);
  let size = (this.color + 1) * this.apparition / time
  textSize(10 * size);

  if (time > this.apparition && time < (coeff_t - 0.5) * this.apparition) {
    fill(colors[this.color]);
    text(this.word, this.position.x - this.word.length * 10 * size, this.position.y);
  }
  else if (time >= max_delta) {
    resetAnimation();
    return;
  }
  else if (time > coeff_t * this.apparition) text("", this.position.x, this.position.y);
  else if (time > 0) {
    if (this.apparition > time) textSize(30 * (this.color + 1) * time / this.apparition);
    else textSize(30 * size);
    console.log(time)
    fill(colors[(int)(Math.random() * 3)]);

    text(".", this.position.x, this.position.y);
  }

  time += deltaTime;
  pop();


}



// Wraparound
Boid.prototype.borders = function () {
  if (this.position.x < -this.r) this.position.x = width + this.r;
  if (this.position.y < -this.r) this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
  let desiredseparation = this.word.length * this.word.length * 100;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}


