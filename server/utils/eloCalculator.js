/**
 * ELO Rating System Implementation
 * Based on the standard ELO rating algorithm used in chess and other competitive games
 */

class EloCalculator {
  constructor(kFactor = 32) {
    this.kFactor = kFactor; // K-factor determines how much ratings change
  }

  /**
   * Calculate expected score for a player
   * @param {number} playerRating - Current rating of the player
   * @param {number} opponentRating - Current rating of the opponent
   * @returns {number} Expected score (0-1)
   */
  calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Calculate new ELO ratings after a match
   * @param {number} player1Rating - Current rating of player 1
   * @param {number} player2Rating - Current rating of player 2
   * @param {number} player1Score - Player 1's score in the match
   * @param {number} player2Score - Player 2's score in the match
   * @returns {Object} New ratings for both players
   */
  calculateNewRatings(player1Rating, player2Rating, player1Score, player2Score) {
    // Determine match result (1 = win, 0.5 = draw, 0 = loss)
    let player1Result, player2Result;
    
    if (player1Score > player2Score) {
      player1Result = 1;
      player2Result = 0;
    } else if (player2Score > player1Score) {
      player1Result = 0;
      player2Result = 1;
    } else {
      // Tie (rare in ping pong, but handled)
      player1Result = 0.5;
      player2Result = 0.5;
    }

    // Calculate expected scores
    const player1Expected = this.calculateExpectedScore(player1Rating, player2Rating);
    const player2Expected = this.calculateExpectedScore(player2Rating, player1Rating);

    // Calculate new ratings
    const player1NewRating = Math.round(
      player1Rating + this.kFactor * (player1Result - player1Expected)
    );
    const player2NewRating = Math.round(
      player2Rating + this.kFactor * (player2Result - player2Expected)
    );

    return {
      player1: {
        oldRating: player1Rating,
        newRating: Math.max(100, player1NewRating), // Minimum rating of 100
        change: player1NewRating - player1Rating
      },
      player2: {
        oldRating: player2Rating,
        newRating: Math.max(100, player2NewRating), // Minimum rating of 100
        change: player2NewRating - player2Rating
      }
    };
  }

  /**
   * Calculate rating change for a single player
   * @param {number} playerRating - Current player rating
   * @param {number} opponentRating - Opponent's rating
   * @param {boolean} won - Whether the player won
   * @returns {number} Rating change
   */
  calculateRatingChange(playerRating, opponentRating, won) {
    const expected = this.calculateExpectedScore(playerRating, opponentRating);
    const actual = won ? 1 : 0;
    return Math.round(this.kFactor * (actual - expected));
  }

  /**
   * Get K-factor based on player's current rating and number of games
   * Advanced implementation that adjusts K-factor based on experience
   * @param {number} rating - Player's current rating
   * @param {number} gamesPlayed - Number of games played
   * @returns {number} Adjusted K-factor
   */
  getAdaptiveKFactor(rating, gamesPlayed) {
    // Higher K-factor for new players (more volatile ratings)
    if (gamesPlayed < 30) return 40;
    
    // Lower K-factor for established players
    if (rating >= 2400) return 16;
    if (rating >= 2100) return 24;
    
    return 32; // Default K-factor
  }
}

module.exports = EloCalculator;
