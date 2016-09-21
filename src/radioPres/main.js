/* global document */
/* eslint no-console:0 no-var:0 */

// form is een NodeList
var form = document.querySelectorAll('input[type="radio"]');

// Kijk maar
console.log(form);

// Functie waarin iets met het event gedaan wordt
function handleEvent(event) {
  // console.log(event);
  // console.log(event.target);
  console.log(event.target.value);
}

// Bind event listeners aan alle radio buttons
form.forEach((radio) => {
  radio.addEventListener('click', handleEvent);
});
