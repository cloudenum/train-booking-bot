# Traveloka: Auto Train Ticket Booking

> **USE AT YOUR OWN RISK.** I AM NOT RESPONSIBLE FOR ANYTHING THAT HAPPENS TO YOUR ACCOUNT.

This bot does not require you to log in, but there are still risks involved.

## Requirements

- Node.js 21+

## Installation

```bash
pnpm install
```

## Usage

```
$ node ./src/index.js -h
Usage: index [options]

Options:
  -o, --origin <origin>            Origin station code
  -d, --destination <destination>  Destination station code
  -t, --departure-date <date>      Departure date in YYYY-MM-DD format
  --train-names <trainNames...>    Train names to filter by (default: [])
  --min-price <minPrice>           Minimum price to filter by
  --max-price <maxPrice>           Maximum price to filter by
  --depart-times <departTimes...>  Departure times to filter by (choices: "morning",
                                   "afternoon", "evening", "night")
  --only-direct                    Only show direct trains (default: false)
  --sort-by <sortBy>               Sort by (choices: "price", "earliest_depart_time",
                                   "latest_depart_time")
  --title <title>                  Passenger title (choices: "MR", "MRS", "MS")
  --full-name <fullName>           Passenger full name
  --email <email>                  Passenger email
  --phone-number <phoneNumber>     Passenger phone number
  --national-id <nationalId>       Passenger national ID
  -h, --help                       display help for command
```

### Example

```bash
node ./src/index.js -o PSE -d LPY -t "2025-03-28"  --max-price 300000 --depart-times morning --only-direct --sort-by price
```

#### Run at specific time

You can use a scheduler to run a script with the bot command.

Here is an example script:

```bash
node "./src/index.js" -d PSE -o LPY -t "2025-03-28" --title MR --full-name "John Doe" --email "email@example.com" --phone-number "081234567890" --national-id "330..." --depart-times morning --max-price 300000 --sort-by price
```

> **Note:** You must supply the passenger details to run in an automated script, otherwise the bot will wait for the user to input the details.

##### Linux

On linux, you can use `cron` to run the script at a specific time.

##### Windows

On windows, you can use `Task Scheduler` to run the script at a specific time.
