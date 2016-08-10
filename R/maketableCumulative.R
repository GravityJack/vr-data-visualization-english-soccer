#' Make a league table
#'
#' @param df The results dataframe
#' @param Season The Season
#' @param tier The tier
#' @param pts Points for a win. Default is 3.
#' @section Notes:
#' The table that is produced is based upon 3 points for a win (unless otherwise
#' defined), 1 for a draw and 0 for a loss.  The table is sorted based upon descending
#' GD and then descending GF as tie-breakers. Different leagues have had different
#' methods for tie-breaks over the years. This league table is a simple generic one.
#' It also does not evaluate points deducted from teams or if games were  artificially
#' awarded to one side based on games not being played.
#' @return a dataframe with a league table
#' @importFrom magrittr "%>%"
#' @examples
#' maketable(df=england,Season=2013,tier=1,pts=3)
#' @export


maketableCumulative <- function(df=NULL,
                                   Season=NULL,
                                   tier=NULL, pts=3){

  GA<-GF<-ga<-gf<-gd<-GD<-D<-L<-W<-Pts<-.<-Date<-home<-team<-visitor<-hgoal<-opp<-vgoal<-goaldif <-FT<-division<-result<-maxgoal<-mingoal<-absgoaldif<-NULL

  dfx <- df[(df$Season==Season & df$tier==tier),]

  day = 0
  temp <- maketablePartialSeason(df, Season, tier, day) %>% mutate(Season=Season, currentday=day, tier=tier, rank=Pos) %>% as.data.frame()

  for(day in 1:300) {
    v = maketablePartialSeason(df, Season, tier, day) %>% mutate(Season=Season, currentday=day, tier=tier, rank=Pos) %>% as.data.frame()
    temp <- rbind(temp, v)
  }
  return(temp)
}



