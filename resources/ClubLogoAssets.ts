// Importy log klubowych
import arkaGdyniaLogo            from '../Graphic/logo/arka-gdynia-2009-logo.png';
import baltykGdyniaLogo          from '../Graphic/logo/baltyk_gdynia.png';
import bronRadomLogo             from '../Graphic/logo/bron-radom-2020-logo.png';
import termalicaNieciecza        from '../Graphic/logo/bruk-bet-termalica-nieciecza-2021-logo.png';
import chojniczankaChojnice      from '../Graphic/logo/Chojniczanka_chojnice.png';
import chrobryGlogowLogo         from '../Graphic/logo/chrobry_glogow.png';
import cracoviaLogo              from '../Graphic/logo/cracovia-2024-logo.png';
import elanaTorunLogo            from '../Graphic/logo/Elana_Torun.png';
import gksKatowiceLogo           from '../Graphic/logo/gks-katowice-logo.png';
import gksJastrzebieLogo         from '../Graphic/logo/GKS_Jastrzębie.png';
import gksbelchatowLogo          from '../Graphic/logo/gksbelchatow.png';
import gksTychyLogo              from '../Graphic/logo/gks_tychy.png';
import gornikLecznaLogo          from '../Graphic/logo/gornik_leczna.png';
import gornikZabrzeLogo          from '../Graphic/logo/Gornik_zabrze.png';
import hutnikKrakowLogo          from '../Graphic/logo/Hutnik_krakow.png';
import jagielloniaBialystokLogo  from '../Graphic/logo/jagiellonia-bialystok-2024-logo.png';
import kks1925KaliszLogo         from '../Graphic/logo/kks-1925-kalisz.png';
import koronaKielceLogo          from '../Graphic/logo/korona-kielce-2024-logo.png';
import kszoOstrowiecLogo         from '../Graphic/logo/kszo-ostrowiec-swietokrzyski.png';
import lechPoznanLogo            from '../Graphic/logo/lech-poznan-2022-logo.png';
import lechiagdanskLogo          from '../Graphic/logo/lechia_gdansk.png';
import legiaWarszawaLogo         from '../Graphic/logo/legia-warsaw-2019-logo.png';
import lksGoczalkowiceZdrojLogo  from '../Graphic/logo/lks-goczalkowice-zdroj-2025-logo.png';
import lksLodzLogo               from '../Graphic/logo/lks_lodz.png';
import miedzLegnicaLogo          from '../Graphic/logo/miedz-legnica-2022-logo.png';
import motorLublinLogo           from '../Graphic/logo/motor-lublin-2023-logo.png';
import odraOpoleLogo             from '../Graphic/logo/odra-opole.png';
import olimpiaGrudziadzLogo      from '../Graphic/logo/olimpia_grudziadz.png';
import piastGliwiceLogo          from '../Graphic/logo/piast-gliwice-1997-logo.png';
import podbeskidzieBBLogo        from '../Graphic/logo/Podbeskidzie_bielsko_biala.png';
import podhaleNTLogo             from '../Graphic/logo/Podhale_Nowy_Targ.png';
import pogonGrodziskLogo         from '../Graphic/logo/pogon-grodzisk-mazowiecki.png';
import pogonSzczecinLogo         from '../Graphic/logo/pogon_szczecin.png';
import pogonsiedlceLogo          from '../Graphic/logo/pogon_siedlce.png';
import poloniaBydgoszczLogo      from '../Graphic/logo/polonia-bydgoszcz-logo.png';
import poloniaBytomsLogo         from '../Graphic/logo/Polonia_Bytom.png';
import poloniaWarszawaLogo       from '../Graphic/logo/Polonia_warszawa.png';
import puszczaNiepolomiceLogo    from '../Graphic/logo/puszcza-niepolomice-2013-logo.png';
import rakowCzestochowaLogo      from '../Graphic/logo/rakow-czestochowa-2014-logo.png';
import rekordBBLogo              from '../Graphic/logo/Rekord_Bielsko-Biała.png';
import resoviaLogo               from '../Graphic/logo/Resovia.png';
import radomiakRadomLogo         from '../Graphic/logo/RKS_Radomiak_Radom.png';
import ruchChorzowLogo           from '../Graphic/logo/ruch-chorzow-2021-logo.png';
import sandecjaNowyLogo          from '../Graphic/logo/Sandecja_Nowy_sacz.png';
import siarkaTarnobrzegLogo      from '../Graphic/logo/siarka-tarnobrzeg-logo.png';
import skraCzestochowaLogo       from '../Graphic/logo/skra-czestochowa-2023-logo.png';
import slaskWroclawLogo          from '../Graphic/logo/Slask_Wroclaw.png';
import sokolKleczewLogo          from '../Graphic/logo/sokol-kleczew-logo.png';
import stalMielecLogo            from '../Graphic/logo/stal-mielec.png';
import stalRzeszowLogo           from '../Graphic/logo/stal-rzeszow-2025-logo.png';
import stalStalowaWolaLogo       from '../Graphic/logo/stal-stalowa-wola-2024-logo.png';
import switSzczecinLogo          from '../Graphic/logo/swit_szczecin.png';
import uniaSkierniewiceLogo      from '../Graphic/logo/Unia_Skierniewice.png';
import wartaPoznanLogo           from '../Graphic/logo/warta-poznan.png';
import widzewLodzLogo            from '../Graphic/logo/widzew-lodz.png';
import wieczyskaKrakowLogo       from '../Graphic/logo/wieczysta-krakow-logo.png';
import wislaKrakowLogo           from '../Graphic/logo/wisla-krakow-logo.png';
import wislaPlockLogo            from '../Graphic/logo/wisla-plock-2006-logo.png';
import zabkoviaZabkiLogo         from '../Graphic/logo/zabkovia-zabki-2018-logo.png';
import zaglebieLubinLogo         from '../Graphic/logo/zaglebie-lubin-2022-logo.png';
import zaglebieSosnowiecLogo     from '../Graphic/logo/Zaglebie_Sosnowiec.png';
import zawiszaBydgoszczLogo      from '../Graphic/logo/zawisza-bydgoszcz.png';
import zniczPruszkow             from '../Graphic/logo/znicz-pruszkow.png';


//ENGLISH:
import manchestercitylogo from '../Graphic/logo/england/man_city.png';
import manchesterunitedlogo from '../Graphic/logo/england/man_utd.png';


//SPAIN
import barcelonaLogo from '../Graphic/logo/spain/barcelona.png';
import realmadridlogo from '../Graphic/logo/spain/real_madrid.png'; // Placeholder, replace with actual Real Madrid logo when available

// Mapa: clubId → URL loga
export const CLUB_LOGOS: Record<string, string> = {
  PL_ARKA_GDYNIA:                    arkaGdyniaLogo,
  PL_BALTYK_GDYNIA:                  baltykGdyniaLogo,
  PL_BRON_RADOM:                     bronRadomLogo,
  PL_TERMALICA_NIECIECZA:            termalicaNieciecza,
  PL_CHOJNICZANKA_CHOJNICE:          chojniczankaChojnice,
  PL_CHROBRY_GLOGOW:                 chrobryGlogowLogo,
  PL_CRACOVIA:                       cracoviaLogo,
  PL_ELANA_TORUN:                    elanaTorunLogo,
  PL_GKS_KATOWICE:                   gksKatowiceLogo,
  PL_GKS_JASTRZEBIE:                 gksJastrzebieLogo,
  PL_GKS_TYCHY:                      gksTychyLogo,
  PL_GORNIK_LECZNA:                  gornikLecznaLogo,
  PL_GKS_BELCHATOW:                  gksbelchatowLogo,
  PL_GORNIK_ZABRZE:                  gornikZabrzeLogo,
  PL_HUTNIK_KRAKOW:                  hutnikKrakowLogo,
  PL_JAGIELLONIA_BIALYSTOK:          jagielloniaBialystokLogo,
  PL_KKS_1925_KALISZ:                kks1925KaliszLogo,
  PL_KORONA_KIELCE:                  koronaKielceLogo,
  PL_KSZO_OSTROWIEC:                 kszoOstrowiecLogo,
  PL_LECH_POZNAN:                    lechPoznanLogo,
  PL_LEGIA_WARSZAWA:                 legiaWarszawaLogo,
  PL_LKS_GOCZALKOWICE_ZDROJ:        lksGoczalkowiceZdrojLogo,
  PL_LECHIA_GDANSK:                  lechiagdanskLogo,
  PL_LKS_LODZ:                       lksLodzLogo,
  PL_MIEDZ_LEGNICA:                  miedzLegnicaLogo,
  PL_MOTOR_LUBLIN:                   motorLublinLogo,
  PL_ODRA_OPOLE:                     odraOpoleLogo,
  PL_OLIMPIA_GRUDZIADZ:              olimpiaGrudziadzLogo,
  PL_PIAST_GLIWICE:                  piastGliwiceLogo,
  PL_PODBESKIDZIE_BIELSKO_BIALA:     podbeskidzieBBLogo,
  PL_PODHALE_NOWY_TARG:              podhaleNTLogo,
  PL_POGON_GRODZISK_MAZOWIECKI:      pogonGrodziskLogo,
  PL_POGON_SZCZECIN:                 pogonSzczecinLogo,
  PL_POGON_SIEDLCE:                  pogonsiedlceLogo,
  PL_POLONIA_BYDGOSZCZ:              poloniaBydgoszczLogo,
  PL_POLONIA_BYTOM:                  poloniaBytomsLogo,
  PL_POLONIA_WARSZAWA:               poloniaWarszawaLogo,
  PL_PUSZCZA_NIEPOLOMICE:            puszczaNiepolomiceLogo,
  PL_RAKOW_CZESTOCHOWA:              rakowCzestochowaLogo,
  PL_REKORD_BIELSKO_BIALA:           rekordBBLogo,
  PL_RESOVIA:                        resoviaLogo,
  PL_RADOMIAK_RADOM:                 radomiakRadomLogo,
  PL_RUCH_CHORZOW:                   ruchChorzowLogo,
  PL_SANDECJA_NOWY_SACZ:             sandecjaNowyLogo,
  PL_SIARKA_TARNOBRZEG:              siarkaTarnobrzegLogo,
  PL_SKRA_CZESTOCHOWA:               skraCzestochowaLogo,
  PL_SLASK_WROCLAW:                  slaskWroclawLogo,
  PL_SOKOL_KLECZEW:                  sokolKleczewLogo,
  PL_STAL_MIELEC:                    stalMielecLogo,
  PL_STAL_RZESZOW:                   stalRzeszowLogo,
  PL_STAL_STALOWA_WOLA:              stalStalowaWolaLogo,
  PL_SWIT_SZCZECIN:                  switSzczecinLogo,
  PL_UNIA_SKIERNIEWICE:              uniaSkierniewiceLogo,
  PL_WARTA_POZNAN:                   wartaPoznanLogo,
  PL_WIDZEW_LODZ:                    widzewLodzLogo,
  PL_WIECZYSTA_KRAKOW:               wieczyskaKrakowLogo,
  PL_WISLA_KRAKOW:                   wislaKrakowLogo,
  PL_WISLA_PLOCK:                    wislaPlockLogo,
  PL_ZABKOVIA_ZABKI:                 zabkoviaZabkiLogo,
  PL_ZAGLEBIE_LUBIN:                 zaglebieLubinLogo,
  PL_ZAGLEBIE_SOSNOWIEC:             zaglebieSosnowiecLogo,
  PL_ZAWISZA_BYDGOSZCZ:              zawiszaBydgoszczLogo,
  PL_ZNICZ_PRUSZKOW:                 zniczPruszkow,



  EU_CL_MANCHESTER_CITY:                 manchestercitylogo,
  EU_CL_MANCHESTER_UNITED:              manchesterunitedlogo,


EU_CL_FC_BARCELONA:                       barcelonaLogo,
EU_CL_REAL_MADRYT:                       realmadridlogo, // Placeholder, replace with actual Real Madrid logo when available
};

/**
 * Zwraca URL loga dla danego clubId, lub undefined jeśli logo nie istnieje.
 */
export function getClubLogo(clubId: string): string | undefined {
  return CLUB_LOGOS[clubId];
}
