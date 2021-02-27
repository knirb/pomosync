const second = 1000;
const minute = 60 * second;

export const calcEndTime = (timeLeft) => {
  console.log(
    Date.now() + timeLeft.minutes * minute + timeLeft.seconds * second
  );
  console.log(
    "added to now(): ",
    timeLeft.minutes * minute + timeLeft.seconds * second
  );
  return Date.now() + timeLeft.minutes * minute + timeLeft.seconds * second;
};

export const calcTimeLeft = (endTime) => {
  const diff = endTime - Date.now();

  let minutes = Math.floor(diff / minute);
  minutes = minutes >= 0 ? minutes : 0;
  let seconds = Math.ceil((diff - minutes * minute) / second);
  seconds = seconds >= 0 ? seconds : 0;
  return { minutes, seconds };
};
