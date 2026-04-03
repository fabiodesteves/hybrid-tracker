// API for public holidays
export async function fetchPortugalHolidays(year) {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PT`);
    if (!response.ok) {
      throw new Error("Failed to fetch holidays");
    }
    const data = await response.json();
    // Return an array of date strings in 'YYYY-MM-DD' format
    return data.map(holiday => holiday.date);
  } catch (error) {
    console.error(error);
    return [];
  }
}
