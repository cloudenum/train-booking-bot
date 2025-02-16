#!/usr/bin/env node
import { Command, InvalidArgumentError, Option } from "commander";
import { input, select } from "@inquirer/prompts";
import { Passenger } from "./Models/Passenger.js";
import { TravelokaService } from "./Services/TravelokaService.js";
// import { TiketDotComService } from "./Services/TiketDotComService.js";
import { parsePhoneNumber } from "./Utils/PhoneNumber.js";
import {
  validateDepartureDate,
  validateEmail,
  validateFullName,
  validateNameTitle,
  validateNationalId,
  validatePhoneNumber,
} from "./Utils/Validation.js";
import { processProgramOptions } from "./Utils/Args.js";

const program = new Command();

const ServiceProvider = {
  KAI: "kai",
  TRAVELOKA: "traveloka",
  TIKETDOTCOM: "tiket.com",
};

program
  .requiredOption("-o, --origin <origin>", "Origin station code")
  .requiredOption("-d, --destination <destination>", "Destination station code")
  .requiredOption(
    "-t, --departure-date <date>",
    "Departure date in YYYY-MM-DD format",
  )
  .addOption(
    new Option("-p, --provider <provider>", "Provider")
      .choices(Object.values(ServiceProvider))
      .default(ServiceProvider.TRAVELOKA),
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
    new Option("--random-pick", "Randomly pick a train")
      .default(false)
      .conflicts("pickFirst"),
  )
  .addOption(
    new Option("--pick-first", "Pick the first train")
      .default(false)
      .conflicts("randomPick"),
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

const options = processProgramOptions(program.opts());

console.debug(options);

try {
  if (!validateDepartureDate(options.departureDate)) {
    throw new InvalidArgumentError(
      "Departure date should be valid and in the future or today",
    );
  }

  if (
    options.minPrice &&
    options.maxPrice &&
    options.minPrice > options.maxPrice
  ) {
    throw new InvalidArgumentError(
      "Minimum price must be less than maximum price",
    );
  }

  if (options.title && !validateNameTitle(options.title)) {
    throw new InvalidArgumentError("Title must be one of MR, MRS, MS");
  }

  if (options.fullName && !validateFullName(options.fullName)) {
    throw new InvalidArgumentError("Full name must not be empty");
  }

  if (options.email && !validateEmail(options.email)) {
    throw new InvalidArgumentError("Invalid email");
  }

  if (options.phoneNumber && !validatePhoneNumber(options.phoneNumber)) {
    throw new InvalidArgumentError("Invalid phone number");
  }

  if (options.nationalId && !validateNationalId(options.nationalId)) {
    throw new InvalidArgumentError("National ID number must be 16 digits");
  }
} catch (error) {
  program.error(`error: ${error.message}`, {
    code: "INVALID_ARGUMENT",
    exitCode: 1,
  });
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
      validate: (input) =>
        validateFullName(input) || "Full name must not be empty",
    },
    {
      type: input,
      required: true,
      name: "Email",
      message: "Email:",
      validate: (input) => validateEmail(input) || "Invalid email",
    },
    {
      type: input,
      required: true,
      name: "PhoneNumber",
      message: "Phone Number:",
      validate: (input) => validatePhoneNumber(input) || "Invalid phone number",
    },
    {
      type: input,
      required: true,
      name: "NationalId",
      message: "National ID Number:",
      validate: (input) =>
        validateNationalId(input) || "National ID number must be 16 digits",
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

  console.info("Passenger Info:");
  console.info(passenger);

  let exitCode = 0;
  switch (options.provider) {
    case ServiceProvider.KAI:
      console.error("Provider not supported yet");
      exitCode = 1;
      break;
    case ServiceProvider.TRAVELOKA:
      exitCode = await TravelokaService.AutoBookTicket(passenger, options);
      break;
    case ServiceProvider.TIKETDOTCOM:
      // exitCode = await TiketDotComService.AutoBookTicket(passenger, options);
      console.error("Provider not supported yet");
      exitCode = 1;
      break;
    default:
      console.error("Invalid provider");
      exitCode = 1;
  }

  process.exit(exitCode);
})();
