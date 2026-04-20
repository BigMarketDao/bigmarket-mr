export const llm_markets = [
	{
		description: "Predict whether The Guardian's cricket newsletter will see a subscriber count increase of at least 10% by March 15, 2025.",
		earliest_resolution_date: '2025-03-15',
		market_sector: 'Media',
		outcome_categories: ['Yes', 'No'],
		resolution_criteria: "The subscriber count will be verified by The Guardian's official subscriber data or a reputable third-party analytics platform.",
		sources: ['The Guardian', 'Third-party analytics platforms'],
		title: "Will The Guardian's cricket newsletter subscriber count increase by at least 10% by March 15, 2025?"
	},
	{
		description: "Predict whether The Guardian's rugby union newsletter will receive more than 50,000 unique opens by March 20, 2025.",
		earliest_resolution_date: '2025-03-20',
		market_sector: 'Media',
		outcome_categories: ['Yes', 'No'],
		resolution_criteria: "The unique open count will be verified by The Guardian's official email analytics or a reputable third-party email marketing platform.",
		sources: ['The Guardian', 'Third-party email marketing platforms'],
		title: "Will The Guardian's rugby union newsletter receive more than 50,000 unique opens by March 20, 2025?"
	},
	{
		description: "Predict whether The Guardian's sports weekend action preview article will receive over 100,000 page views by March 25, 2025.",
		earliest_resolution_date: '2025-03-25',
		market_sector: 'Media',
		outcome_categories: ['Yes', 'No'],
		resolution_criteria: "The page view count will be verified by The Guardian's official website analytics or a reputable third-party analytics platform.",
		sources: ['The Guardian', 'Third-party analytics platforms'],
		title: "Will The Guardian's sports weekend action preview article receive over 100,000 page views by March 25, 2025?"
	}
];

export const liverpoolRequest = {
	market_id: 2,
	market_type: 1,
	title: 'Liverpool vs Newcastle United',
	description: 'Will Liverpool extend their lead at the top of the table?',
	resolution_criteria: 'Three possible outcomes: The match is a drawer (select category 0), Liverpool win (select category 1) or Newcastle win (select category 2)',
	outcome_categories: ['drawer', 'Liverpool win', 'Newcastle Win'],
	resolves_at: 1747496563841,
	sources: ['https://www.bbc.co.uk/sport/football/live/ce8j50rn3jyt#Scores']
};
export const liverpoolResponse = {
	ai_response: '1',
	market_id: 2,
	market_type: 1,
	model: 'deepseek',
	prompt:
		"\n    You are an AI resolving a prediction market.\n\n    Market: Liverpool vs Newcastle United\n    Description: Will Liverpool extend their lead at the top of the table?\n    Resolution Criteria: Three possible outcomes: The match is a drawer (select category 0), Liverpool win (select category 1) or Newcastle win (select category 2)\n    Outcomes: drawer, Liverpool win, Newcastle Win\n    Evidence: Premier League LIVE: Liverpool vs Newcastle, Nottingham Forest vs Arsenal, Tottenham vs Man City - radio, text & score updates - BBC SportBBC HomepageSkip to contentAccessibility HelpYour accountHomeNewsSportEarthReelWorklifeTravelCultureFutureMusicTVWeatherSoundsMore menuMore menuSearch BBCHomeNewsSportEarthReelWorklifeTravelCultureFutureMusicTVWeatherSoundsClose menuBBC SportMenuHomeFootballCricketFormula 1Rugby UTennisGolfAthleticsCyclingMoreA-Z SportsAmerican FootballAthleticsBasketballBoxingCricketCyclingDartsDisability SportFootballFormula 1Gaelic GamesGolfGymnasticsHorse RacingMixed Martial ArtsMotorsportNetballOlympic SportsRugby LeagueRugby UnionSnookerSwimmingTennisWinter SportsFull Sports A-ZMore from SportEnglandScotlandWalesNorthern IrelandNews FeedsHelp & FAQsPremier LeagueScores & FixturesTableTop ScorersPremier League: Liverpool move 13 points clear after Man Utd & Man City win and Arsenal held26 February 2025Live Reporting (active)ScoresTablesSummaryBuild-up to five Premier League matchesLeaders Liverpool beat Newcastle to move 13 points clearHaaland gives Man City win at Spurs & Arsenal held at Forest10-man Man Utd beat Ipswich 3-2 in thrillerEverton draw at BrentfordGet Involved: #bbcfootball, via WhatsApp on 03301231826 or text 81111 (UK only, standard message rates apply)Live ReportingEmlyn Begley, Michael Emons and Jess AndersonGoodnight!published at 23:15 Greenwich Mean Time 26 February23:15 GMT 26 FebruaryThanks for joining us this evening as Liverpool win again to strengthen their position at the top of the league and make it look like the trophy is surely heading for Anfield after Arsenal dropped points again.We'll be back tomorrow evening with one more Premier League match as West Ham host Leicester City.See you then!1739Shareclose panelShare pageCopy linkAbout sharingTune in to Match of the Daypublished at 23:13 Greenwich Mean Time 26 February23:13 GMT 26 FebruaryBBC OneDon't forget, Match of the Day is on BBC One right now.Tune in on you\n\n    Your response should be a **single integer**, representing the index of the most suitable outcome from the given list.\n    **Only respond with a number** (0, 1, 2, etc.) and nothing else.\n    ",
	resolution: 1
};
export const eurovisionRequest = {
	market_id: 2,
	market_type: 1,
	title: 'Eurovision Winner 2025',
	description: 'Who wins Eurovision 2025? Another glitter bomb of talentless noise or a rare gem drowning in sequins and autotune? Europe votes, but does anyone really win?',
	resolution_criteria:
		"If the winner’s a gimmick act, we’ll call it ironic. If it’s an actual talent, we’ll call it rigged. And if it’s Sweden—again—just cancel the whole thing. Eurovision doesn’t crown the best; it crowns the loudest. The real winners? Meme accounts and TikTok thirst traps. Europe unites for one night to argue, cry, and pretend it matters. And we'll all do it again next year.",
	outcome_categories: ['Croatia', 'Sweeden', 'Malta', 'Greec', 'Greece', 'Romania', 'Bulgria', 'Slovenia', 'Italy', 'Austria'],
	resolves_at: 1747496563841,
	sources: ['https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025']
};
export const eurovisionResponse = {
	ai_response: '1',
	market_id: 2,
	market_type: 1,
	model: 'deepseek',
	prompt:
		'\n    You are an AI resolving a prediction market.\n\n    Market: Eurovision 2025\n    Description: Another glitter bomb of talentless noise or a rare gem drowning in sequins and autotune\n\n    Your response should be a **single integer**, representing the index of the most suitable outcome from the given list.\n    **Only respond with a number** (0, 1, 2, etc.) and nothing else.\n    ',
	resolution: 4
};
