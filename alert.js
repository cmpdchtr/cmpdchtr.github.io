// const lesson1 = "hours === 8 && minutes === 30 && seconds === 1";

function playSound() {
    const audio = new Audio("oldYellowBricks.mp3"); // Замініть на шлях до вашого звукового файлу
    audio.play();
  }
  
  function checkTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    console.log(hours + " " + minutes + " " + seconds);

    document.getElementById("time").textContent = hours + ":" + minutes + ":" + seconds;
  
    if ((hours === 14 && minutes === 14 && seconds === 1) || (hours === 9 && minutes === 30 && seconds === 1) || (hours === 10 && minutes === 25 && seconds === 1) || (hours === 11 && minutes === 20 && seconds === 1) || (hours === 12 && minutes === 35 && seconds === 1) || (hours === 13 && minutes === 30 && seconds === 1) || (hours === 14 && minutes === 45 && seconds === 1) || (hours === 15 && minutes === 40 && seconds === 1) || (hours === 16 && minutes === 30 && seconds === 1) || (hours === 17 && minutes === 20 && seconds === 1)) {
      playSound();
    }
  }
  
  setInterval(checkTime, 1000); // Перевіряти час щосекунди
  