import firebase from "firebase";

var firebaseConfig = {
  apiKey: "AIzaSyCaWpGYEltze2YevbZfqqOXTHLqdoQWkgI",
  authDomain: "ioptime-meet.firebaseapp.com",
  databaseURL: "https://ioptime-meet-default-rtdb.firebaseio.com",
  projectId: "ioptime-meet",
  storageBucket: "ioptime-meet.appspot.com",
  messagingSenderId: "544336113194",
  appId: "1:544336113194:web:6e66fae509ede1c388dd53",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const db = firebase;

var firepadRef = firebase.database().ref();

export const userName = prompt("What's your name?");
const urlparams = new URLSearchParams(window.location.search);
const roomId = urlparams.get("id");

if (roomId) {
  firepadRef = firepadRef.child(roomId);
} else {
  firepadRef = firepadRef.push();
  window.history.replaceState(null, "Meet", "?id=" + firepadRef.key);
}

export default firepadRef;
