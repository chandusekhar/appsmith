import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { ControlGroup, Classes } from "@blueprintjs/core";
import { debounce, noop, isNull } from "lodash";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import {
  getAllTemplates,
  setTemplateSearchQuery,
} from "actions/templateActions";
import {
  getOrganizationForTemplates,
  getSearchedTemplateList,
  getTemplateSearchQuery,
  isFetchingTemplatesSelector,
  showTemplateNotificationSelector,
} from "selectors/templatesSelectors";
import { fetchPlugins } from "actions/pluginActions";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { editorInitializer } from "utils/EditorUtils";
import { TabItemProps, DefaultTabItem } from "components/ads/Tabs";
import { Popover2 } from "@blueprintjs/popover2";
const SentryRoute = Sentry.withSentryRouting(Route);

const TemplateListWrapper = styled.div`
  padding-top: 26px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
`;

const ResultsCount = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #090707;
  margin-top: 26px;
  margin-left: 32px;
  padding-bottom: 24px;
`;

const Loader = styled(TemplateListWrapper)`
  height: 100vh;
  .results-count {
    height: 20px;
    width: 100px;
  }
`;

const LoadingTemplateList = styled.div`
  margin-top: 24px;
  height: calc(100% - 200px);
  margin-right: 20px;
  margin-left: 32px;
`;

const SearchWrapper = styled.div`
  margin-left: 25px;
`;

const NotificationWrapper = styled.div`
  background-color: #f1f1f1;
  padding: 8px 18px;
  display: flex;
  flex-direction: row;

  .text-wrapper {
    display: flex;
    flex-direction: column;
    margin-left: 18px;
  }

  .description {
    margin-top: 2px;
  }
`;

export function TemplateFeatureNotification() {
  return (
    <NotificationWrapper>
      <Icon name={"info"} size={IconSize.XXL} />
      <div className={"text-wrapper"}>
        <Text type={TextType.H4}>Introducing Templates</Text>
        <Text className="description" type={TextType.P1}>
          You can browse, fork, and make them your own here
        </Text>
      </div>
    </NotificationWrapper>
  );
}

export function TemplatesTabItem(props: TabItemProps) {
  const showTemplateNotification = useSelector(
    showTemplateNotificationSelector,
  );
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const hideNotification =
    isFetchingApplications || isNull(showTemplateNotification);

  return (
    <Popover2
      content={<TemplateFeatureNotification />}
      isOpen={hideNotification ? false : !showTemplateNotification}
      minimal
      placement="bottom-start"
    >
      <DefaultTabItem {...props} />
    </Popover2>
  );
}

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const templateOrganization = useSelector(getOrganizationForTemplates);

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
    // Generate the widget config list
    editorInitializer();
  }, []);

  useEffect(() => {
    if (templateOrganization?.organization.id) {
      dispatch(fetchPlugins(templateOrganization?.organization.id));
      dispatch(getAllTemplates());
    }
  }, [templateOrganization?.organization.id]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function Templates() {
  const templates = useSelector(getSearchedTemplateList);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const dispatch = useDispatch();
  const resultsText =
    templates.length > 1
      ? `Showing all ${templates.length} templates`
      : templates.length === 1
      ? "Showing 1 template"
      : "No templates to show";
  const isLoading = isFetchingApplications || isFetchingTemplates;

  const onChange = (query: string) => {
    dispatch(setTemplateSearchQuery(query));
  };
  const debouncedOnChange = debounce(onChange, 250, { maxWait: 1000 });

  if (isLoading) {
    return (
      <Loader>
        <ResultsCount className={`results-count ${Classes.SKELETON}`} />
        <LoadingTemplateList className={Classes.SKELETON} />
      </Loader>
    );
  }

  return (
    <TemplateListWrapper>
      <SearchWrapper>
        <ControlGroup>
          <SearchInput
            cypressSelector={"t--application-search-input"}
            defaultValue={templateSearchQuery}
            disabled={isLoading}
            onChange={debouncedOnChange || noop}
            placeholder={"Search templates"}
            variant={SearchVariant.BACKGROUND}
          />
        </ControlGroup>
      </SearchWrapper>
      <ResultsCount>{resultsText}</ResultsCount>
      <TemplateList templates={templates} />
    </TemplateListWrapper>
  );
}

export default TemplateRoutes;
