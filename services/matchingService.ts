
import { MatchCandidate, UserProfile, FilterOptions, CompatibilityItem } from '../types';
import { MOCK_MATCH_CANDIDATES } from '../constants';

// --- GEOLOCATION DATA & UTILS ---

const LOCATIONS = [
  "Brooklyn, NY", "Manhattan, NY", "Queens, NY", "Bronx, NY", "Staten Island, NY", 
  "Jersey City, NJ", "Hoboken, NJ", "Newark, NJ", "White Plains, NY", "Yonkers, NY",
  "Stamford, CT", "New Haven, CT", "Long Island, NY", "Astoria, NY", "Williamsburg, NY",
  "Harlem, NY", "Upper East Side, NY", "SoHo, NY", "Tribeca, NY", "Greenpoint, NY"
];

// Mock Coordinates [Lat, Lng] for supported locations
const LOCATION_COORDS: Record<string, [number, number]> = {
    "Brooklyn, NY": [40.6782, -73.9442],
    "Manhattan, NY": [40.7831, -73.9712],
    "Queens, NY": [40.7282, -73.7949],
    "Bronx, NY": [40.8448, -73.8648],
    "Staten Island, NY": [40.5795, -74.1502],
    "Jersey City, NJ": [40.7178, -74.0431],
    "Hoboken, NJ": [40.7439, -74.0324],
    "Newark, NJ": [40.7357, -74.1724],
    "White Plains, NY": [41.0339, -73.7629],
    "Yonkers, NY": [40.9312, -73.8987],
    "Stamford, CT": [41.0534, -73.5387],
    "New Haven, CT": [41.3083, -72.9279],
    "Long Island, NY": [40.7891, -73.1350], // Approximate center
    "Astoria, NY": [40.7644, -73.9235],
    "Williamsburg, NY": [40.7081, -73.9571],
    "Harlem, NY": [40.8115, -73.9465],
    "Upper East Side, NY": [40.7736, -73.9566],
    "SoHo, NY": [40.7233, -74.0030],
    "Tribeca, NY": [40.7163, -74.0086],
    "Greenpoint, NY": [40.7245, -73.9419],
    // Defaults/External
    "Your City": [40.7831, -73.9712], // Default Guest to Manhattan for demo
    "San Francisco, CA": [37.7749, -122.4194],
    "New York, NY": [40.7128, -74.0060]
};

const resolveCoords = (loc: string): [number, number] | null => {
    if (!loc) return null;
    // Direct match
    if (LOCATION_COORDS[loc]) return LOCATION_COORDS[loc];
    // Case-insensitive match
    const foundKey = Object.keys(LOCATION_COORDS).find(k => k.toLowerCase() === loc.toLowerCase());
    if (foundKey) return LOCATION_COORDS[foundKey];
    // Partial match (e.g. "Brooklyn")
    const partialKey = Object.keys(LOCATION_COORDS).find(k => k.toLowerCase().includes(loc.toLowerCase()));
    if (partialKey) return LOCATION_COORDS[partialKey];
    return null;
};

// Haversine Formula for Distance in Miles
const getDistanceFromLatLonInMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// Helper to parse height string "5'11"" to total inches
const getHeightInInches = (heightStr?: string): number => {
    if (!heightStr) return 0;
    const match = heightStr.match(/(\d+)'(\d+)"/);
    if (match) {
        return (parseInt(match[1]) * 12) + parseInt(match[2]);
    }
    // Fallback if only feet or other format (basic robust handling)
    const feetMatch = heightStr.match(/(\d+)'/);
    if (feetMatch) return parseInt(feetMatch[1]) * 12;
    return 0;
};

// --- DATA GENERATORS ---

const NAMES_MALE = [
  "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", 
  "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", 
  "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander", "Ethan", "Jacob",
  "Ryan", "Gary", "Nicholas", "Eric", "Stephen", "Jonathan", "Larry", "Justin", "Scott", "Brandon"
];

const NAMES_FEMALE = [
  "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", 
  "Michelle", "Amanda", "Kimberly", "Melissa", "Stephanie", "Nicole", "Emily", "Heather", "Angela", "Katherine",
  "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
  "Abigail", "Emily", "Harper", "Ella", "Lily", "Grace", "Chloe", "Camila", "Penelope", "Riley"
];

const NAMES_LAST = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", 
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
];

const JOBS = [
  "Software Engineer", "Product Manager", "Teacher", "Nurse", "Doctor", "Lawyer", "Accountant", 
  "Artist", "Designer", "Chef", "Sales Manager", "Marketing Director", "Student", "Writer", 
  "Architect", "Consultant", "Data Scientist", "Pharmacist", "Police Officer", "Firefighter",
  "Real Estate Agent", "Barista", "Personal Trainer", "Therapist", "Social Worker", "Founder",
  "Investment Banker", "Recruiter", "Researcher", "Pilot"
];

const TAGS_LIST = [
  "Coffee", "Hiking", "Travel", "Foodie", "Art", "Music", "Photography", "Reading", "Yoga", 
  "Fitness", "Gaming", "Tech", "Movies", "Cooking", "Dancing", "Wine", "Politics", "Volunteering",
  "Dogs", "Cats", "Running", "Swimming", "Camping", "Fashion", "History", "Writing", "Anime",
  "Museums", "Theater", "Karaoke", "Board Games", "Gardening", "Baking"
];

const UNIVERSITIES = [
  "NYU", "Columbia", "Fordham", "CUNY", "SUNY", "Rutgers", "Princeton", "Yale", "Harvard", 
  "Boston University", "Penn State", "Cornell", "MIT", "Stanford", "UCLA", "University of Florida",
  "University of Michigan", "Duke", "Berkeley", "Self-Taught"
];

// Helper to pick random element
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to pick multiple distinct random elements
const pickMulti = <T>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

// Helper for dynamic generation
const getRandomName = () => {
    const isFemale = Math.random() > 0.5;
    const first = pick(isFemale ? NAMES_FEMALE : NAMES_MALE);
    const last = pick(NAMES_LAST);
    return `${first} ${last}`;
};

// Generate 100 Random Users with all 74 attributes
const generateMockUsers = (count: number): MatchCandidate[] => {
    return Array.from({ length: count }, (_, i) => {
        const id = `user_gen_${i + 100}`;
        const name = getRandomName();
        const location = pick(LOCATIONS);
        const tags = pickMulti(TAGS_LIST, 3);
        const job = pick(JOBS);
        
        // Randomize Attributes for Filtering
        const ethnicity = pick(['Asian', 'Black', 'Caucasian', 'Hispanic', 'Indian', 'Middle Eastern', 'Mixed', 'Other']);
        const religion = pick(['Agnostic', 'Atheist', 'Buddhist', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Spiritual', 'Other']);
        const politics = pick(['Liberal', 'Moderate', 'Conservative', 'Apolitical', 'Other']);
        const education = pick(['High School', 'Undergraduate', 'Postgraduate', 'PhD', 'Trade School']);
        const smoking = pick(['No', 'Socially', 'Regularly']);
        const drinking = pick(['No', 'Socially', 'Regularly']);
        const marijuana = pick(['No', 'Socially', 'Regularly']);
        const drugs = pick(['No', 'Sometimes', 'Often']);
        const children = pick(['Has children', 'No children']);
        const familyPlans = pick(['Wants children', 'Open to children', 'Does not want children']);
        const relationshipType = pick(['Monogamous', 'Polyamorous', 'Open', 'Casual']);
        const interestedIn = pick(['Men', 'Women', 'Everyone']);
        const heightFt = 5 + Math.floor(Math.random() * 2);
        const heightIn = Math.floor(Math.random() * 12);
        const loveLanguage = pick(['Words of Affirmation', 'Acts of Service', 'Receiving Gifts', 'Quality Time', 'Physical Touch']);
        
        // Randomly assign social media
        const hasLinkedin = Math.random() > 0.6;
        const hasInstagram = Math.random() > 0.5;

        // Premium / Tier Logic
        const rand = Math.random();
        let subscriptionTier: 'PRO' | 'PLUS' | undefined;
        if (rand > 0.9) subscriptionTier = 'PRO';
        else if (rand > 0.8) subscriptionTier = 'PLUS';
        
        const isPremium = !!subscriptionTier;

        // Last Seen Logic
        const timeType = Math.random();
        let lastSeen;
        let isOnline = false;
        
        if (timeType > 0.7) {
             isOnline = true;
             lastSeen = 'Online';
        } else if (timeType > 0.4) {
             lastSeen = `${Math.floor(Math.random() * 23) + 1}h ago`;
        } else {
             const days = Math.floor(Math.random() * 6) + 2; 
             lastSeen = `${days}d ago`;
        }

        // Expanded 74 attributes generation
        return {
            id,
            name,
            age: Math.floor(Math.random() * (55 - 20) + 20),
            location,
            compatibilityScore: 0, // Calculated dynamically later
            tags,
            bio: `I am a ${job} living in ${location.split(',')[0]}. I love ${tags[0].toLowerCase()}, ${tags[1].toLowerCase()} and ${tags[2].toLowerCase()}. Looking for someone to share good times with.`,
            imageUrls: [
                `https://randomuser.me/api/portraits/women/${i % 99}.jpg`,
                `https://picsum.photos/seed/${id}_2/600/800`,
                `https://picsum.photos/seed/${id}_3/600/800`
            ], 
            jobTitle: job,
            work: pick(["Self Employed", "Freelance", "Corporate", "Startup", "Government", "Tech Co", "Studio"]),
            educationLevel: education,
            university: pick(UNIVERSITIES),
            hometown: pick(LOCATIONS),
            height: `${heightFt}'${heightIn}"`,
            ethnicity,
            religion,
            politics,
            drinking,
            smoking,
            marijuana,
            drugs,
            isOnline,
            isVerified: Math.random() > 0.6,
            isPremium,
            subscriptionTier,
            lastSeen,
            joinedDate: `Jan ${Math.floor(Math.random() * 28) + 1}, 2024`,
            relationshipType,
            children,
            familyPlans,
            datingIntention: pick(['Long-term', 'Short-term', 'Marriage', 'Casual', 'Friendship']),
            covidVaccine: pick(['Vaccinated', 'Not Vaccinated', 'Prefer not to say']),
            languages: pick(['English', 'English, Spanish', 'English, French', 'English, Mandarin', 'English, Hindi']),
            pets: pick(['Dog', 'Cat', 'None', 'Bird', 'Dog, Cat']),
            interestedIn,
            zodiac: pick(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']),
            linkedin: hasLinkedin ? `in/${name.replace(/\s/g, '').toLowerCase()}` : undefined,
            instagram: hasInstagram ? `@${name.replace(/\s/g, '').toLowerCase()}` : undefined,

            // New Attributes Population
            hairColor: pick(['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Dyed/Other']),
            hairType: pick(['Straight', 'Wavy', 'Curly', 'Coily', 'Bald']),
            eyeColor: pick(['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber']),
            race: ethnicity,
            bodyType: pick(['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular']),
            wearsGlasses: pick(['Yes', 'No']),
            wearsLenses: pick(['Yes', 'No']),
            wearsJewelry: pick(['Yes', 'No']),
            bodyHair: pick(['Yes', 'No']),
            drivesCar: pick(['Yes', 'No']),
            hasDriversLicense: pick(['Yes', 'No']),
            canCook: pick(['Yes', 'No']),
            gymRoutine: pick(['Daily', '3-4 times a week', '1-2 times a week', 'Occasionally', 'Never']),
            dressesWell: pick(['Yes', 'No']),
            hasTattoos: pick(['Yes', 'No']),
            lovesTravel: pick(['Yes', 'No']),
            isOrganised: pick(['Very Organised', 'Somewhat', 'Messy']),
            therapyHistory: pick(['Currently attending', 'Used to go', 'Never been', 'Planning to go']),
            childhoodDescription: pick(['Happy', 'Good', 'Average', 'Difficult', 'Traumatic']),
            nationalityCount: Math.floor(Math.random() * 2) + 1,
            hygiene: pick(['Excellent', 'Good', 'Average']),
            futurePlans: pick(['Build a family', 'Travel the world', 'Focus on career', 'Retire early']),
            dreamHouseType: pick(['Modern Apartment', 'Suburban House', 'Farmhouse', 'Beach House', 'Cabin', 'Penthouse']),
            facialHair: pick(['Clean Shaven', 'Stubble', 'Beard', 'Mustache', 'Goatee']),
            makeupRoutine: pick(['No Makeup', 'Minimal/Natural', 'Occasional', 'Daily', 'Glam']),
            musicGenre: pick(['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Electronic', 'Jazz', 'Classical']),
            phoneType: pick(['iPhone', 'Android']),
            livingPreference: pick(['City Center', 'Suburbs', 'Countryside']),
            sportsInterest: pick(['Play Regularly', 'Play Occasionally', 'Watch Only', 'Not Interested']),
            favoriteDrink: pick(['Water', 'Coffee', 'Tea', 'Soda', 'Juice', 'Beer', 'Wine']),
            nextTravelDestination: pick(['Japan', 'Italy', 'France', 'Brazil', 'Australia', 'Canada']),
            travelStyle: pick(['Budget', 'Luxury', 'Adventure', 'Relaxing', 'Cultural']),
            workStyle: pick(['In-Office', 'Remote (WFH)', 'Hybrid']),
            bakingInterest: pick(['Love it', 'Occasionally', 'Never']),
            shoppingPreference: pick(['Mostly Online', 'In-Store', 'Thrift']),
            interracialMarriage: pick(['Open to Interracial', 'No Preference']),
            clothingStyle: pick(['Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist']),
            familyCloseness: pick(['Very Close', 'Moderately Close', 'Distant']),
            snoring: pick(['Yes', 'No', 'Occasionally']),
            familyHealthHistory: pick(['None Known', 'Some Issues']),
            readingInterest: pick(['Avid Reader', 'Occasionally', 'Never']),
            hobbies: pick(['Reading', 'Gaming', 'Cooking', 'Hiking', 'Traveling', 'Photography', 'Music']),
            criminalRecord: 'Clean Record',
            financialSplitting: pick(['Split 50/50', 'I Pay', 'Partner Pays']),
            siblings: pick(['Only Child', 'Has Siblings']),
            loveLanguage,
            // New Relationship Attributes Generation
            conflictResolution: pick(['Calm discussion', 'Needs space', 'Direct & assertive', 'Avoidant']),
            socialBattery: pick(['Introvert', 'Extrovert', 'Ambivert', 'Social Butterfly', 'Homebody']),
            dietaryPreferences: pick(['No restrictions', 'Vegetarian', 'Vegan', 'Keto', 'Halal', 'Kosher', 'Gluten-free']),
            attachmentStyle: pick(['Secure', 'Anxious', 'Avoidant', 'Disorganized']),
            sleepSchedule: pick(['Early Bird', 'Night Owl', 'Flexible', 'Irregular']),
            financialApproach: pick(['Saver', 'Spender', 'Balanced', 'Investor']),
        };
    });
};

// Standardize MOCK_MATCH_CANDIDATES with compatible values
const NORMALIZED_MOCK_MATCH_CANDIDATES = MOCK_MATCH_CANDIDATES.map(c => ({
    ...c,
    ethnicity: c.ethnicity === 'Latina' ? 'Hispanic' : c.ethnicity,
    isVerified: true,
    isPremium: false,
    subscriptionTier: undefined
}));

// Combine Golden Mock Data with 100 Generated Users
const MOCK_DB: MatchCandidate[] = [
    ...NORMALIZED_MOCK_MATCH_CANDIDATES,
    ...generateMockUsers(100)
];

// --- DYNAMIC GENERATOR ---

const generateDynamicMockUsers = (query: string, count: number = 3): MatchCandidate[] => {
    const lowerQuery = query.toLowerCase();
    
    // 1. Detect Job from Query
    const EXTENDED_JOBS = [
        ...JOBS, 
        "Doctor", "Physician", "Surgeon", "Dentist", "Cardiologist", "Nurse", 
        "Writer", "Architect", "Manager", "Analyst", "Product Manager", "CEO", "Founder",
        "Influencer", "Fitness Influencer", "Trainer", "Personal Trainer", "Coach", "Model",
        "Youtuber", "Streamer", "Content Creator", "Designer", "Chef", "Pilot"
    ];
    EXTENDED_JOBS.sort((a, b) => b.length - a.length);
    
    const matchedJob = EXTENDED_JOBS.find(j => lowerQuery.includes(j.toLowerCase()));
    
    // 2. Detect Height from Query
    let matchedHeight: string | undefined;
    const heightRegex = /(?:(\d+)\s*(?:feet|ft|')\s*(?:(\d+)\s*(?:inches|in|"))?)|tall|short/i;
    const heightMatch = query.match(heightRegex);
    if (heightMatch) {
        if (heightMatch[1]) {
            matchedHeight = `${heightMatch[1]}'${heightMatch[2] || '0'}"`;
        } else if (lowerQuery.includes('tall')) {
            matchedHeight = "6'2\"";
        } else if (lowerQuery.includes('short')) {
            matchedHeight = "5'2\"";
        }
    }

    // 3. Detect Hobbies from Query
    const matchedTags: string[] = [];
    TAGS_LIST.forEach(tag => {
        if (lowerQuery.includes(tag.toLowerCase())) {
            matchedTags.push(tag);
        }
    });
    if (lowerQuery.includes('baking') && !matchedTags.includes('Baking')) matchedTags.push('Baking');

    // 4. Detect Physical Attributes
    let matchedEyeColor: string | undefined;
    const eyeColors = ['blue', 'green', 'brown', 'hazel', 'gray', 'amber'];
    const eyeRegex = new RegExp(`(${eyeColors.join('|')})\\s*(?:eye|eyes|eyed)`, 'i');
    const eyeMatch = lowerQuery.match(eyeRegex);
    if (eyeMatch) matchedEyeColor = eyeMatch[1].charAt(0).toUpperCase() + eyeMatch[1].slice(1);

    let matchedHairColor: string | undefined;
    const hairColors = ['blonde', 'black', 'brown', 'red', 'gray', 'white', 'platinum'];
    if (lowerQuery.includes('brunette')) matchedHairColor = 'Brown';
    else if (lowerQuery.includes('ginger')) matchedHairColor = 'Red';
    else {
        const hairRegex = new RegExp(`(${hairColors.join('|')})\\s*(?:hair|haired)`, 'i');
        const hairMatch = lowerQuery.match(hairRegex);
        if (hairMatch) matchedHairColor = hairMatch[1].charAt(0).toUpperCase() + hairMatch[1].slice(1);
        else if (lowerQuery.includes('blonde')) matchedHairColor = 'Blonde';
    }

    // 5. Generate Candidates
    return Array.from({ length: count }, (_, i) => {
        const base = generateMockUsers(1)[0];
        base.id = `dynamic_gen_${Date.now()}_${i}`;
        
        base.imageUrls[0] = `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 99)}.jpg`;

        if (matchedJob) {
            base.jobTitle = matchedJob;
            base.work = "Self Employed";
            base.bio = base.bio.replace(/I am a ([\w\s]+)/i, `I am a ${matchedJob}`);
        }
        
        if (matchedHeight) {
            base.height = matchedHeight;
            if (!base.bio.includes("tall")) {
                base.bio += ` I stand ${matchedHeight.replace("'", "ft ").replace('"', "in")} tall.`;
            }
        }

        if (matchedEyeColor) {
            base.eyeColor = matchedEyeColor;
            base.bio += ` I have beautiful ${matchedEyeColor.toLowerCase()} eyes.`;
        }
        if (matchedHairColor) {
            base.hairColor = matchedHairColor;
        }

        if (matchedTags.length > 0) {
            base.tags = [...new Set([...matchedTags, ...base.tags])].slice(0, 5);
            const hobbiesString = matchedTags.join(' and ');
            base.bio += ` I'm really passionate about ${hobbiesString}.`;
        }
        
        base.compatibilityScore = 96 + Math.floor(Math.random() * 4);

        return base;
    });
};


// 2. THE ALGORITHM
export const calculateMatch = (
    currentUser: UserProfile, 
    candidate: MatchCandidate, 
    searchQuery: string
): { score: number, report: CompatibilityItem[] } => {
    let score = 60; // Base Score
    const report: CompatibilityItem[] = [];

    // A. LOGICAL HARD MATCHING
    
    // 1. Location Proximity
    if (currentUser.location && candidate.location) {
        const userCity = currentUser.location.split(',')[0].trim();
        if (candidate.location.includes(userCity)) {
            score += 15;
            report.push({ icon: '✅', text: `Located in ${userCity}`, color: 'text-green-600' });
        } else if (candidate.location.includes('NY') && currentUser.location.includes('NY')) {
            score += 5;
            report.push({ icon: '✅', text: 'Located in same region', color: 'text-green-600' });
        } else {
            report.push({ icon: '⚠️', text: 'Distance is outside preferred city', color: 'text-yellow-600' });
        }
    }

    // 2. Age Preference logic
    if (currentUser.age) {
        const ageDiff = Math.abs(currentUser.age - candidate.age);
        if (ageDiff <= 3) {
            score += 15;
            report.push({ icon: '✅', text: 'Similar age', color: 'text-green-600' });
        } else if (ageDiff <= 6) {
            score += 10;
            report.push({ icon: '✅', text: 'Comfortable age gap', color: 'text-green-600' });
        } else if (ageDiff <= 10) {
            score += 5;
        } else {
            report.push({ icon: '⚠️', text: 'Larger age gap', color: 'text-yellow-600' });
        }
    }

    // 3. Vices Compatibility
    let vicesMismatch = false;
    if (currentUser.smoking === 'No' && candidate.smoking !== 'No') {
        score -= 15;
        vicesMismatch = true;
        report.push({ icon: '⚠️', text: 'Smoking preference mismatch', color: 'text-yellow-600' });
    }
    if (currentUser.drugs === 'No' && candidate.drugs !== 'No') {
        score -= 20;
        vicesMismatch = true;
        report.push({ icon: '❌', text: 'Mismatch on lifestyle choices (Drugs)', color: 'text-red-600' });
    }
    if (!vicesMismatch && currentUser.smoking === 'No' && candidate.smoking === 'No' && currentUser.drugs === 'No' && candidate.drugs === 'No') {
        report.push({ icon: '✅', text: 'Both non-smokers & drug-free', color: 'text-green-600' });
    }

    // 4. Family Plans
    if (currentUser.familyPlans && candidate.familyPlans) {
        if (currentUser.familyPlans === candidate.familyPlans) {
            score += 10;
            report.push({ icon: '✅', text: 'Aligned family goals', color: 'text-green-600' });
        } else if (
            (currentUser.familyPlans.includes('Wants') && candidate.familyPlans.includes('Does not')) ||
            (candidate.familyPlans.includes('Wants') && currentUser.familyPlans.includes('Does not'))
        ) {
            score -= 20;
            report.push({ icon: '❌', text: 'Conflict on family plans', color: 'text-red-600' });
        }
    }

    // Politics & Religion
    if (currentUser.politics && candidate.politics && currentUser.politics === candidate.politics) {
        score += 5;
        report.push({ icon: '✅', text: `Politics aligned (${candidate.politics})`, color: 'text-green-600' });
    }
    if (currentUser.religion && candidate.religion && currentUser.religion === candidate.religion) {
        score += 5;
        report.push({ icon: '✅', text: `Shared beliefs (${candidate.religion})`, color: 'text-green-600' });
    }

    // Love Language
    if (currentUser.loveLanguage && candidate.loveLanguage && currentUser.loveLanguage === candidate.loveLanguage) {
        score += 10;
        report.push({ icon: '❤️', text: `Same Love Language (${candidate.loveLanguage})`, color: 'text-pink-600' });
    }

    // New Relationship Attributes Logic
    if (currentUser.dietaryPreferences && candidate.dietaryPreferences) {
        if (currentUser.dietaryPreferences === candidate.dietaryPreferences) {
            score += 5;
            report.push({ icon: '🥗', text: `Shared diet (${candidate.dietaryPreferences})`, color: 'text-green-600' });
        } else if ((currentUser.dietaryPreferences === 'Vegan' && candidate.dietaryPreferences === 'No restrictions') || (candidate.dietaryPreferences === 'Vegan' && currentUser.dietaryPreferences === 'No restrictions')) {
            report.push({ icon: '⚠️', text: 'Dietary lifestyle difference', color: 'text-yellow-600' });
        }
    }

    if (currentUser.sleepSchedule && candidate.sleepSchedule) {
        if (currentUser.sleepSchedule === candidate.sleepSchedule) {
            score += 5;
            report.push({ icon: '💤', text: 'Compatible sleep schedule', color: 'text-green-600' });
        } else if ((currentUser.sleepSchedule === 'Early Bird' && candidate.sleepSchedule === 'Night Owl') || (candidate.sleepSchedule === 'Early Bird' && currentUser.sleepSchedule === 'Night Owl')) {
            score -= 5;
            report.push({ icon: '⚠️', text: 'Opposite sleep schedules', color: 'text-yellow-600' });
        }
    }

    if (currentUser.attachmentStyle && candidate.attachmentStyle) {
        if (currentUser.attachmentStyle === 'Secure' && candidate.attachmentStyle === 'Secure') {
            score += 5;
            report.push({ icon: '🔒', text: 'Secure attachment match', color: 'text-green-600' });
        }
        // Avoidant + Anxious combo check
        if ((currentUser.attachmentStyle === 'Avoidant' && candidate.attachmentStyle === 'Anxious') || (candidate.attachmentStyle === 'Avoidant' && currentUser.attachmentStyle === 'Anxious')) {
            score -= 5;
            report.push({ icon: '⚠️', text: 'Attachment style potential friction', color: 'text-yellow-600' });
        }
    }

    if (currentUser.financialApproach && candidate.financialApproach) {
        if ((currentUser.financialApproach === 'Saver' && candidate.financialApproach === 'Spender') || (candidate.financialApproach === 'Saver' && currentUser.financialApproach === 'Spender')) {
            score -= 5;
            report.push({ icon: '💰', text: 'Different financial approaches', color: 'text-yellow-600' });
        } else if (currentUser.financialApproach === candidate.financialApproach) {
            score += 5;
            report.push({ icon: '💰', text: 'Shared financial values', color: 'text-green-600' });
        }
    }

    if (currentUser.socialBattery && candidate.socialBattery) {
        if (currentUser.socialBattery === 'Ambivert' || candidate.socialBattery === 'Ambivert' || currentUser.socialBattery === candidate.socialBattery) {
             score += 5;
             report.push({ icon: '🔋', text: 'Compatible social energy', color: 'text-green-600' });
        }
    }

    // B. SEARCH QUERY MATCHING
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        
        const fieldsToSearch: (keyof MatchCandidate)[] = [
            'name', 'bio', 'jobTitle', 'work', 'university', 'educationLevel', 'religion', 'politics', 
            'location', 'ethnicity', 'children', 'familyPlans', 'covidVaccine', 'pets', 'zodiac', 
            'languages', 'datingIntention', 'relationshipType', 'drinking', 'smoking', 'marijuana', 
            'drugs', 'hairColor', 'hairType', 'eyeColor', 'race', 'bodyType', 'wearsGlasses', 
            'wearsLenses', 'wearsJewelry', 'bodyHair', 'drivesCar', 'hasDriversLicense', 'canCook', 
            'gymRoutine', 'dressesWell', 'hasTattoos', 'lovesTravel', 'isOrganised', 'therapyHistory', 
            'childhoodDescription', 'nationalityCount', 'hygiene', 'futurePlans', 'dreamHouseType', 
            'facialHair', 'makeupRoutine', 'musicGenre', 'phoneType', 'livingPreference', 'sportsInterest', 
            'favoriteDrink', 'nextTravelDestination', 'travelStyle', 'workStyle', 'bakingInterest', 
            'shoppingPreference', 'interracialMarriage', 'clothingStyle', 'familyCloseness', 'snoring', 
            'familyHealthHistory', 'readingInterest', 'hobbies', 'criminalRecord', 'financialSplitting', 
            'siblings', 'loveLanguage',
            // New fields searchable
            'conflictResolution', 'socialBattery', 'dietaryPreferences', 'attachmentStyle', 'sleepSchedule', 'financialApproach'
        ];

        let corpus = candidate.tags.join(' ').toLowerCase() + ' ';
        fieldsToSearch.forEach(field => {
            const val = candidate[field];
            if (val !== undefined && val !== null) {
                corpus += String(val).toLowerCase() + ' ';
            }
        });

        if (corpus.includes(query)) {
            score += 30; 
            report.push({ icon: '✨', text: `Matches your search for "${query}"`, color: 'text-blue-600' });
        }
        
        const queryWords = query.split(' ');
        let keywordMatches = 0;
        const matchedKeywords: string[] = [];
        queryWords.forEach(word => {
            if (word.length > 3 && corpus.includes(word)) {
                keywordMatches++;
                if(!matchedKeywords.includes(word)) matchedKeywords.push(word);
            }
        });
        score += (keywordMatches * 5);
        if (keywordMatches > 0 && !corpus.includes(query)) {
             report.push({ icon: '🔑', text: `Matches keywords: ${matchedKeywords.slice(0,2).join(', ')}`, color: 'text-blue-600' });
        }

        if (candidate.eyeColor && query.includes(candidate.eyeColor.toLowerCase())) {
            score += 20;
            report.push({ icon: '✅', text: `Has ${candidate.eyeColor} eyes`, color: 'text-green-600' });
        }
        if (candidate.hairColor && query.includes(candidate.hairColor.toLowerCase())) {
            score += 20;
            report.push({ icon: '✅', text: `Has ${candidate.hairColor} hair`, color: 'text-green-600' });
        }
    }

    return { score: Math.min(99, Math.max(40, score)), report };
};

export const getVerdict = (score: number, name: string): string => {
    if (score >= 95) return `A match made in heaven! You and ${name} are exceptionally compatible across almost every dimension.`;
    if (score >= 90) return `Incredible potential. ${name} shares your core values and lifestyle preferences.`;
    if (score >= 80) return `Great compatibility! You have a lot in common with ${name} and very few conflicts.`;
    if (score >= 70) return `Solid match. You and ${name} align on the big things, with some interesting differences.`;
    if (score >= 60) return `Good potential. There's enough common ground with ${name} to build something real.`;
    return `Worth exploring. Opposites attract, and you might find ${name} intriguing despite differences.`;
};

export const findMatches = async (
    currentUser: UserProfile, 
    query: string, 
    filters: FilterOptions,
    signal?: AbortSignal
): Promise<MatchCandidate[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (signal?.aborted) throw new Error('Aborted');

    let candidates = [...MOCK_DB];
    
    if (query.trim().length > 3) {
        const dynamicCandidates = generateDynamicMockUsers(query, 3);
        candidates = [...dynamicCandidates, ...candidates];
    }

    candidates = candidates.filter(c => {
        if (filters.ageRange) {
            if (c.age < filters.ageRange[0] || c.age > filters.ageRange[1]) return false;
        }

        if (filters.maxDistance && filters.maxDistance < 50 && currentUser.location && c.location) {
            const userCoords = resolveCoords(currentUser.location) || LOCATION_COORDS["New York, NY"];
            const matchCoords = resolveCoords(c.location);
            if (matchCoords) {
                const dist = getDistanceFromLatLonInMiles(userCoords[0], userCoords[1], matchCoords[0], matchCoords[1]);
                if (dist > filters.maxDistance) return false;
            } else {
                return false; 
            }
        }
        
        if (filters.isOnline && !c.isOnline) return false;
        if (filters.isVerified && !c.isVerified) return false;
        if (filters.isPremium && !c.isPremium) return false;
        if (filters.hasLinkedin && !c.linkedin) return false;
        if (filters.hasInstagram && !c.instagram) return false;

        if (filters.smoking === 'No' && c.smoking !== 'No') return false;
        if (filters.drinking === 'No' && c.drinking !== 'No') return false;
        if (filters.marijuana === 'No' && c.marijuana !== 'No') return false;
        if (filters.drugs === 'No' && c.drugs !== 'No') return false;

        if (filters.children === 'No children' && c.children !== 'No children') return false;
        if (filters.familyPlans && c.familyPlans !== filters.familyPlans) return false;

        if (filters.ethnicity && c.ethnicity !== filters.ethnicity) return false;
        if (filters.religion && c.religion !== filters.religion) return false;
        if (filters.politics && c.politics !== filters.politics) return false;
        if (filters.height) {
             const userHeight = getHeightInInches(c.height);
             if (filters.height === 'Short' && userHeight >= 66) return false;
             if (filters.height === 'Average' && (userHeight < 66 || userHeight > 72)) return false;
             if (filters.height === 'Tall' && userHeight <= 72) return false;
             if (filters.height === 'Very Tall' && userHeight <= 76) return false;
        }
        if (filters.educationLevel && c.educationLevel !== filters.educationLevel) return false;
        if (filters.relationshipType && c.relationshipType !== filters.relationshipType) return false;
        if (filters.datingIntention && c.datingIntention !== filters.datingIntention) return false;

        if (filters.recentlyActive) {
            if (!c.isOnline && (!c.lastSeen || c.lastSeen.includes('d ago'))) return false;
        }

        return true;
    });

    const scoredCandidates = candidates.map(candidate => {
        const { score, report } = calculateMatch(currentUser, candidate, query);
        return { ...candidate, compatibilityScore: score, compatibilityReport: report };
    });

    scoredCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return scoredCandidates.slice(0, 20);
};
