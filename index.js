require('dotenv').config();
const { GistBox } = require('gist-box');
const { v2, auth } = require('osu-api-extended');

const SCOPE_LIST = ['public'];

const main = async () => {
  const { GIST_ID, OSU_USERNAME, OSU_MODE, GH_TOKEN, CLIENT_ID, CLIENT_SECRET } = process.env;

  console.log(`Getting data for ${OSU_USERNAME}`);

  try {
    // Auth via client
    await auth.login(CLIENT_ID, CLIENT_SECRET, { scopes: SCOPE_LIST });
    const data = await v2.user.details(OSU_USERNAME, OSU_MODE);

    // Menyusun data dengan pemeriksaan untuk mencegah kesalahan
    const level = data.statistics.level || { current: 0, progress: 0 };
    const globalRank = data.statistics.global_rank || 0;
    const countryRank = data.statistics.country_rank || 0;
    const pp = data.statistics.pp || 0;
    const accuracy = data.statistics.hit_accuracy || 0;
    const playTime = data.statistics.play_time || 0;
    const playCount = data.statistics.play_count || 0;

    const lines = [
      `${"Level".padStart(9)} 🎮 | Lv${level.current} ${generateBarChart(level.progress, 21)} ${level.progress}%\n`,
      `${"Rank".padStart(9)} 📈 | ${("#" + numberWithCommas(globalRank))} / ${getFlagEmoji(data.country.code)} #${numberWithCommas(countryRank).padEnd(7)} (${numberWithCommas(pp)}pp)\n`,
      `${"Accuracy".padStart(9)} 🎯 | ${Math.round(parseFloat(accuracy) * 100) / 100}%\n`,
      `${"Playtime".padStart(9)} 🕓 | ${numberWithCommas(Math.floor(playTime / 60 / 60))} hr\n`,
      `${"Playcount".padStart(9)} 💾 | ${numberWithCommas(playCount)}\n`,
    ];

    const box = new GistBox({ id: GIST_ID, token: GH_TOKEN });

    // Memperbarui Gist
    await box.update({
      filename: `🎶 ${data.username}'s osu!${OSU_MODE === "osu" ? "" : OSU_MODE} stats`,
      content: lines.join('')
    });

    console.log('Gist updated!');
  } catch (err) {
    console.error('Error getting or updating the Gist:');
    console.error(err);
  }
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function generateBarChart(percent, size) {
  const syms = "░▏▎▍▌▋▊▉█";

  const frac = Math.floor((size * 8 * percent) / 100);
  const barsFull = Math.floor(frac / 8);
  if (barsFull >= size) {
    return syms.substring(8, 9).repeat(size);
  }
  const semi = frac % 8;

  return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
    .join("")
    .padEnd(size, syms.substring(0, 1));
}

main();
