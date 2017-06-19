import { ArchiveAppPage } from './app.po';

describe('archive-app App', () => {
  let page: ArchiveAppPage;

  beforeEach(() => {
    page = new ArchiveAppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
