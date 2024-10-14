export const args = {};

let i = 2;
while (i !== process.argv.length) {
  const [prop, value] = process.argv[i].slice(2).split(`=`);
  args[prop] = value;
  i++;
}
