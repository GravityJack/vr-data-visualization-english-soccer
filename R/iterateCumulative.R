
temp = maketableCumulative(df, 1995, 1)

print(c(Season, tier))
v = maketableCumulative(df, 1995, 2)
temp <- rbind(temp, v)

print(c(Season, tier))
v = maketableCumulative(df, 1995, 3)
temp <- rbind(temp, v)

print(c(Season, tier))
v = maketableCumulative(df, 1995, 4)
temp <- rbind(temp, v)

for (Season in 1996:2015) {
  for (tier in 1:4) {
    print(c(Season, tier))
    v = maketableCumulative(df, Season=Season, tier=tier)
    temp <- rbind(temp, v)
  }
}

write.csv(temp, 'engsoccerdataCumulativeStandings.csv', sep=',')

