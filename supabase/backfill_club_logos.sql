-- 클럽 설정 화면(관리자 로그인 후) 연동 작업 중 추가.
--
-- 지금까지 메인 화면 배지 이미지는 clubs 테이블이 아니라 lib/teams.ts에 박혀
-- 있는 고정 목록에서 나왔다 — 그래서 관리자 설정 화면에서 clubs.logo_url을
-- 수정해도 화면에 반영이 안 됐다(수정 UI와 실제 표시 로직이 분리돼 있던 버그).
-- 이번에 TeamBadge가 clubs.logo_url을 우선 쓰도록 고쳤으니(이 테이블이 이제
-- 진짜 출처), 이미 화면에 로고가 뜨고 있던 팀들의 clubs.logo_url이 비어 있으면
-- 설정 화면에서 빈 칸으로 보이고 - 저장 전까지는 fallback으로 여전히 예전
-- 로고가 보이긴 하지만, 설정 화면에서 "지금 로고가 이 주소다"를 보여주기 위해
-- 기존 값을 여기로 옮겨 채워 넣는다. 한 번만 실행하면 됨 (이미 값이 있으면
-- 덮어쓰니, 직접 다른 주소로 바꿔둔 팀이 있으면 이 파일을 다시 실행하지 말 것).
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Tottenham_Hotspur.svg' where name = '토트넘 홋스퍼';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Manchester_City_FC_badge.svg' where name = '맨체스터 시티';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Manchester_United_FC_crest.svg' where name = '맨체스터 유나이티드';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Liverpool_FC.svg' where name = '리버풀';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Chelsea_FC.svg' where name = '첼시';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Brighton_%26_Hove_Albion_logo.svg' where name = '브라이튼';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Paris_Saint-Germain_F.C..svg' where name = '파리 생제르맹';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Real_Madrid_CF.svg' where name = '레알 마드리드';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/FC_Barcelona_(crest).svg' where name = 'FC 바르셀로나';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Juventus_FC_2017_icon.svg' where name = '유벤투스';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Logo_of_AC_Milan.svg' where name = 'AC 밀란';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/FC_Bayern_M%C3%BCnchen_logo_(2017).svg' where name = '바이에른 뮌헨';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Borussia_Dortmund_logo.svg' where name = '보루시아 도르트문트';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Arsenal_FC.svg' where name = '아스널';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/West_Ham_United_FC_logo.svg' where name = '웨스트햄 유나이티드';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Atletico_Madrid_2017_logo.svg' where name = '아틀레티코 마드리드';
update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/FC_Internazionale_Milano_2021.svg' where name = '인터 밀란';
