import { t, type Locale } from '../i18n';

export function getTeamColorClasses(team: string): string {
  switch (team) {
    case 'red':
      return 'bg-red-500/20 border-red-500 text-red-400';
    case 'blue':
      return 'bg-blue-500/20 border-blue-500 text-blue-400';
    case 'red-blue':
      return 'bg-gradient-to-r from-red-500/20 to-blue-500/20 border-l-red-500 border-r-blue-500 border-t-red-500 border-b-blue-500 text-red-400';
    case 'grey':
      return 'bg-zinc-500/20 border-zinc-500 text-zinc-400';
    case 'green':
      return 'bg-green-500/20 border-green-500 text-green-400';
    case 'yellow':
      return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
    case 'special':
      return 'bg-pink-500/20 border-pink-500 text-pink-400';
    case 'black':
      return 'bg-black/40 border-zinc-500 text-zinc-300';
    default:
      return 'bg-zinc-800/20 border-zinc-700 text-zinc-400';
  }
}

export function getTeamBannerClasses(team: string): string {
  switch (team) {
    case 'red':
      return 'bg-red-600';
    case 'blue':
      return 'bg-blue-600';
    case 'red-blue':
      return 'bg-gradient-to-b from-red-600 to-blue-600';
    case 'grey':
      return 'bg-zinc-500';
    case 'green':
      return 'bg-green-600';
    case 'yellow':
      return 'bg-yellow-500';
    case 'special':
      return 'bg-pink-600';
    case 'black':
      return 'bg-black';
    default:
      return 'bg-zinc-700';
  }
}

export function getTeamLabel(team: string, locale: Locale = 'en'): string {
  switch (team) {
    case 'red':
      return t(locale, 'team.red').toUpperCase();
    case 'blue':
      return t(locale, 'team.blue').toUpperCase();
    case 'red-blue':
      return t(locale, 'team.redBlueLabel');
    case 'grey':
      return t(locale, 'team.grey').toUpperCase();
    case 'green':
      return t(locale, 'team.green').toUpperCase();
    case 'yellow':
      return t(locale, 'team.yellow').toUpperCase();
    case 'special':
      return t(locale, 'team.special').toUpperCase();
    case 'black':
      return t(locale, 'team.black').toUpperCase();
    default:
      return team.toUpperCase();
  }
}

export function getTeamFilterLabel(teamId: string | null, locale: Locale = 'en'): string {
  if (!teamId) return t(locale, 'team.all');
  switch (teamId) {
    case 'red':
      return t(locale, 'team.red');
    case 'blue':
      return t(locale, 'team.blue');
    case 'red-blue':
      return t(locale, 'team.redBlue');
    case 'grey':
      return t(locale, 'team.grey');
    case 'green':
      return t(locale, 'team.green');
    case 'yellow':
      return t(locale, 'team.yellow');
    case 'special':
      return t(locale, 'team.special');
    default:
      return teamId;
  }
}
