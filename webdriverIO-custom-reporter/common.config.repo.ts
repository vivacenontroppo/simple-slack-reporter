export class CommonConfig {
  public readonly url = {
    devEnv: 'https://***.com/',
    prodEnv: 'https://***.com/',
  };
  public readonly user = {
    devClient: {
      login: 'marian.kucharski@gmx.com',
      password: 'SomeTH1NG!',
    },
  };
  public readonly searchData = {
    atlanta: 'atlanta',
    specificLaAddress: '15215 Runnymede Street, Van Nuys, CA 91405',
    atlantaZipCode: '30326',
    agent1FirstName: 'Sharron',
    agent1LastName: 'Richardson',
    agent1Address: '134 Queen Street E. Suite 100, Brampton, ON',
    agent1Office: 'EXIT REALTY HARE (PEEL), BROKERAGE',
    agent1Description:
      'As a member of the west GTA community for over 35 years, I have a wealth of knowledge of both the area and the market. I have helped many families sell, buy, or invest in a new home and I love what I do. Call, text or email me if you would like answers to your real estate questions. ',
    agent1Role: 'Sales Representative',
    agent1Mobile: '416 417 7013',
    agent1Email: 'srichardson@exitrealty.com',
    agent1Website: 'www.sharronexit.com',
  };
  public copy = {
    mainSection: {
      header: 'EXIT Realty, A Smart Move!™',
      sloganParagraph: 'Find your dream home!',
      buyFilterBtn: 'BUY A HOME',
      rentFilterBtn: 'RENT A HOME',
      searchInputPlaceholder: 'Search for Address, City, Zip, County or Listing #number',
      showFiltersBtn: 'Show Filters',
      defaultFiltersBtn: 'Use Default Filters',
    },
    searchResult: {
      searchContainter: {
        inputPlaceholder: 'Search for Address, City, State, County, Zip or Listing #number',
        searchBtn: 'Search ',
        moreFiltersBtn: 'More',
        comuteSearchBtn: 'Commute Search ',
        nearbySearchBtn: 'Nearby ',
        clearFiltersBtn: 'Clear',
      },
      resultListContainter: {
        mlsDropdownLabel: 'View results from:',
        mlsLaDefault: 'Georgia MLS',
        sortListDropdown: {
          sort: 'Sort Listings',
          newest: 'Newest Listings',
          oldest: 'Oldest Listings',
          highestPrice: 'Highest Price',
          lowestPrice: 'Lowest Price',
          highestSqft: 'Highest Sqft',
          lowestSqft: 'Lowest Sqft',
        },
        propertyContainter: {
          activeTag: 'Active',
          rentalTag: 'Rental',
          bath: 'Bathroom',
          bed: 'Bedrooms',
          sqft: 'Square Feet',
          days: 'On exitrealty.com',
        },
        map: {
          infoReloadBtnLaDefault: 'Showing 100 of',
        },
      },
    },
  };
  public readonly slack = {
    channel: 'C01A7EY7A9G',
    logInfo: ['./log.txt', 'UTF-8'],
    errorMsg: '--- Test failed! Check the results! ---',
    succMsg: '--- Test succed! ---',
    pipelinesUrl: '***',
  };
}
