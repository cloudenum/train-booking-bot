#!/usr/bin/env node
import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { Command, InvalidOptionArgumentError, Option } from "commander";
import { input, select } from "@inquirer/prompts";
import { Passenger, TravelokaService } from "./Services/TravelokaService.js";
import { parsePhoneNumber } from "./Utils/PhoneNumber.js";

const program = new Command();

program
  .requiredOption("-o, --origin <origin>", "Origin station code")
  .requiredOption("-d, --destination <destination>", "Destination station code")
  .requiredOption(
    "-t, --departure-date <date>",
    "Departure date in YYYY-MM-DD format",
  )
  .option("--train-names <trainNames...>", "Train names to filter by", [])
  .option("--min-price <minPrice>", "Minimum price to filter by")
  .option("--max-price <maxPrice>", "Maximum price to filter by")
  .addOption(
    new Option(
      "--depart-times <departTimes...>",
      "Departure times to filter by",
    ).choices(["morning", "afternoon", "evening", "night"]),
  )
  .option("--only-direct", "Only show direct trains", false)
  .addOption(
    new Option("--sort-by <sortBy>", "Sort by").choices([
      "price",
      "earliest_depart_time",
      "latest_depart_time",
    ]),
  )
  .addOption(
    new Option("--title <title>", "Passenger title").choices([
      "MR",
      "MRS",
      "MS",
    ]),
  )
  .addOption(new Option("--full-name <fullName>", "Passenger full name"))
  .addOption(new Option("--email <email>", "Passenger email"))
  .addOption(
    new Option("--phone-number <phoneNumber>", "Passenger phone number"),
  )
  .addOption(new Option("--national-id <nationalId>", "Passenger national ID"))
  .parse(process.argv);

const options = program.opts();

if (
  options.minPrice &&
  options.maxPrice &&
  options.minPrice > options.maxPrice
) {
  throw new InvalidOptionArgumentError(
    "Minimum price must be less than maximum price",
  );
}

(async () => {
  const passengerQuestions = [
    {
      type: select,
      name: "Title",
      message: "Title:",
      choices: [
        {
          name: "Mr.",
          value: "MR",
        },
        {
          name: "Mrs.",
          value: "MRS",
        },
        {
          name: "Ms.",
          value: "MS",
        },
      ],
      default: "Mr.",
    },
    {
      type: input,
      required: true,
      name: "FullName",
      message: "Full Name:",
    },
    {
      type: input,
      required: true,
      name: "Email",
      message: "Email:",
      validate: (input) => {
        const emailRegex =
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(input)) {
          return "Invalid email address";
        }

        return true;
      },
    },
    {
      type: input,
      required: true,
      name: "PhoneNumber",
      message: "Phone Number:",
      validate: (input) => {
        try {
          parsePhoneNumber(input);
          return true;
        } catch (err) {
          return err.message;
        }
      },
    },
    {
      type: input,
      required: true,
      name: "NationalId",
      message: "National ID Number:",
      validate: (input) => {
        if (input.length !== 16) {
          return "National ID number must be 16 characters";
        }
        return true;
      },
    },
  ];

  const answers = {
    Title: options.title,
    FullName: options.fullName,
    Email: options.email,
    PhoneNumber: options.phoneNumber,
    NationalId: options.nationalId,
  };
  for (const question of passengerQuestions) {
    if (!answers[question.name]) {
      const answer = await question.type(question);
      answers[question.name] = answer;
    }
  }

  // Build passenger object
  const passenger = new Passenger();
  passenger.Title = answers.Title;
  passenger.FullName = answers.FullName;
  passenger.Email = answers.Email;
  passenger.PhoneNumber = parsePhoneNumber(answers.PhoneNumber);
  passenger.NationalID = answers.NationalId;

  console.log("Passenger Info:");
  console.log(passenger);

  // Call the auto-booking service with command-line options and passenger info
  const exitCode = await TravelokaService.AutoBookTicket(passenger, options);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Press any key to exit ...", () => {
    rl.close();
    process.exit(0);
  });
})();
